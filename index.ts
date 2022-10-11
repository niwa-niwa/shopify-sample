import { readFileSync } from "fs";
import Shopify from "shopify-api-node";
import values from "./consts";

const getShopify = (): Shopify => {
  return new Shopify({
    shopName: values.shopName,
    apiKey: values.apiKey,
    password: values.password,
    apiVersion: values.apiVersion,
    // autoLimit: {calls:2,interval:3000,bucketSize:100},
    maxRetries: 3,
  });
};

const query: string = `
  query get($first: Int) {
    files(first: $first) {
      edges {
        cursor
        node {
          createdAt
          ... on GenericFile {
            id
            url
            createdAt
          }
          ... on MediaImage {
            id
            createdAt
            image {
              id
              url
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

function makeThrottledError(client: Shopify) {
  client.on("callLimits", (limits) => console.log(limits));

  for (let i = 0; i < 50; i++) {
    console.log(`exec index = ${i} `, client.callLimits);

    client
      .graphql(query, { first: 30 })
      .then((result) => {
        console.log(`success index = ${i}`, client.callLimits);
      })
      .catch((err) => {
        console.error(`error index = ${i}`, err, client.callLimits);
      });
  }
}

async function main() {
  const shopifyClient = getShopify();

  // makeThrottledError(shopifyClient);

  // const result2 = await shopifyClient.asset.list(values.theme_id);
  // console.log("result2 =", result2);

  // makeThrottledError(shopifyClient)

  const fileBase64 = readFileSync("./page.custom.landing.liquid", "base64");

  const uploadParam = {
    key: "templates/page.custom.landing.liquid",
    attachment: fileBase64,
  };
  // const result = await shopifyClient.graphql(query, { first: 20 });
  // shopifyClient.on("callLimits", (limits) => console.log(limits));

  // console.log("result =", result);

  //  assetsアップロード updateでファイルが無ければ自動作成になる
  const asset_result = await shopifyClient.asset.update(
    values.theme_id,
    uploadParam
  );

  console.log("asset_result = ", asset_result);
}

main();
