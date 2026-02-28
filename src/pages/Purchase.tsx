import { Box, Container, Typography, useTheme } from "@mui/material";
import { useEffect, useRef } from "react";
import { Header } from "../components/Header";

const SHOPIFY_SDK_URL = "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
const LIGHT_COLLECTION_NODE_ID = "shopify-buy-button-light";
const DARK_COLLECTION_NODE_ID = "shopify-buy-button-dark";

let shopifySdkPromise: Promise<any> | null = null;

function loadShopifySdk(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Shopify SDK can only load in the browser."));
  }

  const existing = (window as any).ShopifyBuy;
  if (existing?.UI) {
    return Promise.resolve(existing);
  }

  if (shopifySdkPromise) {
    return shopifySdkPromise;
  }

  shopifySdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = SHOPIFY_SDK_URL;
    script.onload = () => {
      const loaded = (window as any).ShopifyBuy;
      if (loaded?.UI) {
        resolve(loaded);
        return;
      }
      reject(new Error("Shopify SDK loaded but ShopifyBuy.UI is unavailable."));
    };
    script.onerror = () => reject(new Error("Failed to load Shopify Buy Button SDK."));
    (document.head || document.body).appendChild(script);
  });

  return shopifySdkPromise;
}

function Purchase() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const lightInitializedRef = useRef(false);
  const darkInitializedRef = useRef(false);

  useEffect(() => {
    if (!isLight || lightInitializedRef.current) {
      return;
    }

    const node = document.getElementById(LIGHT_COLLECTION_NODE_ID);
    if (!node) {
      return;
    }

    node.innerHTML = "";

    lightInitializedRef.current = true;

    void loadShopifySdk()
      .then((ShopifyBuy) => {
        const client = ShopifyBuy.buildClient({
          domain: "kzb1fs-w5.myshopify.com",
          storefrontAccessToken: "8e3db60cdc8fe73015406c0cbb047a94",
        });

        return ShopifyBuy.UI.onReady(client).then((ui: any) => {
          ui.createComponent("collection", {
            id: "523408245014",
            node,
            moneyFormat: "%24%7B%7Bamount%7D%7D",
            options: {
              product: {
                styles: {
                  product: {
                    "@media (min-width: 601px)": {
                      maxWidth: "calc(33.33333% - 30px)",
                      marginLeft: "30px",
                      marginBottom: "50px",
                      width: "calc(33.33333% - 30px)",
                    },
                    img: {
                      height: "calc(100% - 15px)",
                      position: "absolute",
                      left: "0",
                      right: "0",
                      top: "0",
                    },
                    imgWrapper: {
                      paddingTop: "calc(75% + 15px)",
                      position: "relative",
                      height: "0",
                    },
                  },
                  title: { color: "#1d2227" },
                  button: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                    color: "#1d2227",
                    ":hover": {
                      color: "#1d2227",
                      backgroundColor: "#e6a100",
                    },
                    backgroundColor: "#ffb300",
                    ":focus": { backgroundColor: "#e6a100" },
                    borderRadius: "40px",
                    paddingLeft: "61px",
                    paddingRight: "61px",
                  },
                  quantityInput: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                  },
                  price: { color: "#1d2227" },
                  compareAt: { color: "#1d2227" },
                  unitPrice: { color: "#1d2227" },
                },
                buttonDestination: "checkout",
                text: { button: "Purchase Print" },
              },
              productSet: {
                styles: {
                  products: {
                    "@media (min-width: 601px)": {
                      marginLeft: "-30px",
                    },
                  },
                },
              },
              modalProduct: {
                contents: {
                  img: false,
                  imgWithCarousel: true,
                  button: false,
                  buttonWithQuantity: true,
                },
                styles: {
                  product: {
                    "@media (min-width: 601px)": {
                      maxWidth: "100%",
                      marginLeft: "0px",
                      marginBottom: "0px",
                    },
                  },
                  button: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                    color: "#1d2227",
                    ":hover": {
                      color: "#1d2227",
                      backgroundColor: "#e6a100",
                    },
                    backgroundColor: "#ffb300",
                    ":focus": { backgroundColor: "#e6a100" },
                    borderRadius: "40px",
                    paddingLeft: "61px",
                    paddingRight: "61px",
                  },
                  quantityInput: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                  },
                  title: {
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "bold",
                    fontSize: "26px",
                    color: "#4c4c4c",
                  },
                  price: {
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "normal",
                    fontSize: "18px",
                    color: "#4c4c4c",
                  },
                  compareAt: {
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "normal",
                    fontSize: "15.299999999999999px",
                    color: "#4c4c4c",
                  },
                  unitPrice: {
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "normal",
                    fontSize: "15.299999999999999px",
                    color: "#4c4c4c",
                  },
                },
                text: { button: "Add to cart" },
              },
              option: {
                styles: {
                  label: { color: "#1d2227" },
                },
              },
              cart: {
                styles: {
                  button: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                    color: "#1d2227",
                    ":hover": {
                      color: "#1d2227",
                      backgroundColor: "#e6a100",
                    },
                    backgroundColor: "#ffb300",
                    ":focus": { backgroundColor: "#e6a100" },
                    borderRadius: "40px",
                  },
                },
                text: {
                  total: "Subtotal",
                  button: "Checkout",
                },
              },
              toggle: {
                styles: {
                  toggle: {
                    backgroundColor: "#ffb300",
                    ":hover": { backgroundColor: "#e6a100" },
                    ":focus": { backgroundColor: "#e6a100" },
                  },
                  count: {
                    fontSize: "18px",
                    color: "#1d2227",
                    ":hover": {
                      color: "#1d2227",
                    },
                  },
                  iconPath: {
                    fill: "#1d2227",
                  },
                },
              },
            },
          });

        });
      })
      .catch((error) => {
        lightInitializedRef.current = false;
        // eslint-disable-next-line no-console
        console.error("Failed to initialize Shopify light collection button:", error);
      });
  }, [isLight]);

  useEffect(() => {
    if (isLight || darkInitializedRef.current) {
      return;
    }

    const node = document.getElementById(DARK_COLLECTION_NODE_ID);
    if (!node) {
      return;
    }

    node.innerHTML = "";

    darkInitializedRef.current = true;

    void loadShopifySdk()
      .then((ShopifyBuy) => {
        const client = ShopifyBuy.buildClient({
          domain: "kzb1fs-w5.myshopify.com",
          storefrontAccessToken: "8e3db60cdc8fe73015406c0cbb047a94",
        });

        return ShopifyBuy.UI.onReady(client).then((ui: any) => {
          ui.createComponent("collection", {
            id: "523408245014",
            node,
            moneyFormat: "%24%7B%7Bamount%7D%7D",
            options: {
              product: {
                styles: {
                  product: {
                    "@media (min-width: 601px)": {
                      maxWidth: "calc(33.33333% - 30px)",
                      marginLeft: "30px",
                      marginBottom: "50px",
                      width: "calc(33.33333% - 30px)",
                    },
                    img: {
                      height: "calc(100% - 15px)",
                      position: "absolute",
                      left: "0",
                      right: "0",
                      top: "0",
                    },
                    imgWrapper: {
                      paddingTop: "calc(75% + 15px)",
                      position: "relative",
                      height: "0",
                    },
                  },
                  title: { color: "#ffffff" },
                  button: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                    ":hover": { backgroundColor: "#e6a100" },
                    backgroundColor: "#ffb300",
                    ":focus": { backgroundColor: "#e6a100" },
                    borderRadius: "40px",
                    paddingLeft: "61px",
                    paddingRight: "61px",
                  },
                  quantityInput: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                  },
                  price: { color: "#ffffff" },
                  compareAt: { color: "#ffffff" },
                  unitPrice: { color: "#ffffff" },
                },
                buttonDestination: "checkout",
                text: { button: "Purchase Print" },
              },
              productSet: {
                styles: {
                  products: {
                    "@media (min-width: 601px)": {
                      marginLeft: "-30px",
                    },
                  },
                },
              },
              modalProduct: {
                contents: {
                  img: false,
                  imgWithCarousel: true,
                  button: false,
                  buttonWithQuantity: true,
                },
                styles: {
                  product: {
                    "@media (min-width: 601px)": {
                      maxWidth: "100%",
                      marginLeft: "0px",
                      marginBottom: "0px",
                    },
                  },
                  button: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                    ":hover": { backgroundColor: "#e6a100" },
                    backgroundColor: "#ffb300",
                    ":focus": { backgroundColor: "#e6a100" },
                    borderRadius: "40px",
                    paddingLeft: "61px",
                    paddingRight: "61px",
                  },
                  quantityInput: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                  },
                  title: {
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "bold",
                    fontSize: "26px",
                    color: "#4c4c4c",
                  },
                  price: {
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "normal",
                    fontSize: "18px",
                    color: "#4c4c4c",
                  },
                  compareAt: {
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "normal",
                    fontSize: "15.299999999999999px",
                    color: "#4c4c4c",
                  },
                  unitPrice: {
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "normal",
                    fontSize: "15.299999999999999px",
                    color: "#4c4c4c",
                  },
                },
                text: { button: "Add to cart" },
              },
              option: {
                styles: {
                  label: { color: "#ffffff" },
                },
              },
              cart: {
                styles: {
                  button: {
                    fontSize: "18px",
                    paddingTop: "17px",
                    paddingBottom: "17px",
                    ":hover": { backgroundColor: "#e6a100" },
                    backgroundColor: "#ffb300",
                    ":focus": { backgroundColor: "#e6a100" },
                    borderRadius: "40px",
                  },
                },
                text: {
                  total: "Subtotal",
                  button: "Checkout",
                },
              },
              toggle: {
                styles: {
                  toggle: {
                    backgroundColor: "#ffb300",
                    ":hover": { backgroundColor: "#e6a100" },
                    ":focus": { backgroundColor: "#e6a100" },
                  },
                  count: { fontSize: "18px" },
                },
              },
            },
          });

        });
      })
      .catch((error) => {
        darkInitializedRef.current = false;
        // eslint-disable-next-line no-console
        console.error("Failed to initialize Shopify dark collection button:", error);
      });
  }, [isLight]);

  return (
    <>
      <Header />

      <Box
        sx={{
          background: "linear-gradient(135deg, rgba(255, 179, 0, 0.05) 0%, rgba(255, 107, 53, 0.05) 100%)",
          borderBottom: "1px solid rgba(255, 179, 0, 0.1)",
          py: { xs: 6, sm: 8, md: 10 },
          textAlign: "center",
          px: { xs: 2, sm: 3, md: 4 },
          position: "relative",
          zIndex: 1,
        }}
      >
        <Container maxWidth="lg" sx={{ px: 0 }}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: "clamp(1.5rem, 5vw, 2.5rem)", md: "clamp(2rem, 6vw, 3rem)" },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              mb: 2,
              color: "#FFB300",
              textShadow: "0 0 20px rgba(255, 179, 0, 0.3)",
            }}
          >
            Purchase Prints
          </Typography>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 4, md: 6 }, px: { xs: 2, sm: 3, md: 4 } }}>

        <Box sx={{ display: isLight ? "block" : "none", minHeight: 120 }} id={LIGHT_COLLECTION_NODE_ID} />

        <Box sx={{ display: !isLight ? "block" : "none", minHeight: 120 }} id={DARK_COLLECTION_NODE_ID} />
      </Box>
    </>
  );
}

export default Purchase;
