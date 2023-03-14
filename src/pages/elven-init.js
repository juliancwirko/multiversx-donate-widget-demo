//
import {
  ElvenJS,
  Transaction,
  Address,
  TransactionPayload,
  TokenPayment,
} from "elven.js";

// UI states helper
const uiLoggedInState = (loggedIn) => {
  const loginXPortalButton = window.document.getElementById(
    "button-login-mobile"
  );
  const logoutButton = document.getElementById("button-logout");
  const txButton = document.getElementById("button-tx");
  if (loggedIn) {
    loginXPortalButton.style.setProperty('display',"none");
    logoutButton.style.setProperty('display', 'block');
    txButton.style.setProperty('display', 'block');
  } else {
    loginXPortalButton.style.setProperty('display',"block");
    logoutButton.style.setProperty('display', 'none');
    txButton.style.setProperty('display', 'none');
  }
};

// UI spinner helper
const uiSpinnerState = (isLoading) => {
  const buttonLoginMobile = document.getElementById("button-login-mobile");
  const buttonEgld = document.getElementById("button-tx");
  const pendingTxt = "Pending...";
  if (isLoading) {
    buttonLoginMobile.innerText = pendingTxt;
    buttonLoginMobile.setAttribute("disabled", true);
    buttonEgld.innerText = pendingTxt;
    buttonEgld.setAttribute("disabled", true);
  } else {
    buttonLoginMobile.innerText = "Connect!";
    buttonLoginMobile.removeAttribute("disabled");
    buttonEgld.innerText = "Donate!";
    buttonEgld.removeAttribute("disabled");
  }
};

// Update the link to the MultiversX explorer after the transaction is done
const updateTxHashContainer = (txHash) => {
  const txHashContainer = document.getElementById("tx-hash");
  if (txHash) {
    const url = `https://devnet-explorer.multiversx.com/transactions/${txHash}`;
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("rel", "noopener noreferrer");
    link.setAttribute("target", "_blank");
    link.classList.add("transaction-link");
    link.innerText = url;
    txHashContainer.appendChild(link);
  } else {
    txHashContainer?.querySelector("a")?.remove();
  }
};

// Init the elven.js
const initElven = async () => {
  await ElvenJS.init({
    apiUrl: 'https://devnet-api.multiversx.com',
    chainType: 'devnet',
    apiTimeout: 10000,
    // Remember to change it. Get yours here: https://cloud.walletconnect.com/sign-in
    walletConnectV2ProjectId: 'f502675c63610bfe4454080ac86d70e6',
    walletConnectV2RelayAddresses: ['wss://relay.walletconnect.com'],
    onLoginPending: () => {
      uiSpinnerState(true);
    },
    onLoggedIn: () => {
      uiLoggedInState(true);
      uiSpinnerState(false);
    },
    onLogout: () => {
      uiLoggedInState(false);
      uiSpinnerState(false);
      updateTxHashContainer('');
    },
    onTxStarted: () => {
      uiSpinnerState(true);
    },
    onTxSent: (tx) => {},
    onTxFinalized: (tx) => {
      tx?.hash && updateTxHashContainer(tx.hash);
      uiSpinnerState(false);
    },
    onTxError: (tx, error) => {
      console.log('Error: ', error);
    },
    onQrPending: () => {
      uiSpinnerState(true);
    },
    onQrLoaded: () => {
      uiSpinnerState(false);
    },
  });
};

initElven();

// Login with xPortal Button mobile app button click listener
document
  .getElementById("button-login-mobile")
  .addEventListener("click", async () => {
    try {
      await ElvenJS.login("mobile", {
        qrCodeContainer: "multiversx-donate-widget-container",
      });
    } catch (e) {
      console.log("Login: Something went wrong, try again!", e?.message);
    }
  });

// Send donate transaction, define your address and the price
const egldTransferAddress =
  "erd17a4wydhhd6t3hhssvcp9g23ppn7lgkk4g2tww3eqzx4mlq95dukss0g50f";
const donatePrice = 0.5;

document.getElementById("button-tx").addEventListener("click", async () => {
  updateTxHashContainer(false);
  const demoMessage = "MultiversX donate demo!";

  const tx = new Transaction({
    nonce: ElvenJS.storage.get("nonce"),
    receiver: new Address(egldTransferAddress),
    gasLimit: 50000 + 1500 * demoMessage.length,
    chainID: "D",
    data: new TransactionPayload(demoMessage),
    value: TokenPayment.egldFromAmount(donatePrice),
    sender: new Address(ElvenJS.storage.get("address")),
  });

  try {
    const transaction = await ElvenJS.signAndSendTransaction(tx);
    updateTxHashContainer(transaction.hash);
  } catch (e) {
    throw new Error(e?.message);
  }
});

// Logout
document.getElementById("button-logout").addEventListener("click", async () => {
  try {
    await ElvenJS.logout();
  } catch (e) {
    console.error(e.message);
  }
});
