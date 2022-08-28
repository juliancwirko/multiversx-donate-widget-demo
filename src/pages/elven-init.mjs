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
  const loginMaiarButton = window.document.getElementById("button-login-mobile");
  const logoutButton = document.getElementById("button-logout");
  const txButton = document.getElementById("button-tx");
  if (loggedIn) {
    loginMaiarButton.style.display = "none";
    logoutButton.style.display = "block";
    txButton.style.display = "block";
  } else {
    loginMaiarButton.style.display = "block";
    logoutButton.style.display = "none";
    txButton.style.display = "none";
  }
};

// UI spinner helper
const uiSpinnerState = (isLoading, button) => {
  const buttonLoginMobile = document.getElementById("button-login-mobile");
  const buttonEgld = document.getElementById("button-tx");
  if (isLoading) {
    if (button === "loginMobile") {
      buttonLoginMobile.innerText = "Logging in...";
      buttonLoginMobile.setAttribute("disabled", true);
    }
    if (button === "egld") {
      buttonEgld.innerText = "Transaction pending...";
      buttonEgld.setAttribute("disabled", true);
    }
  } else {
    if (button === "loginMobile") {
      buttonLoginMobile.innerText = "Login with Maiar mobile";
      buttonLoginMobile.removeAttribute("disabled");
    }
    if (button === "egld") {
      buttonEgld.innerText = "Send predefined transaction";
      buttonEgld.removeAttribute("disabled");
    }
  }
};

// Update the link to the Elrond explorer after the transaction is done
const updateTxHashContainer = (txHash) => {
  const txHashContainer = document.getElementById('tx-hash');
  if (txHash) {
    const url = `https://devnet-explorer.elrond.com/transactions/${txHash}`;
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.classList.add('transaction-link');
    link.innerText = url;
    txHashContainer.appendChild(link);
  } else {
    txHashContainer?.querySelector('a')?.remove();
  }
};

// Init the elven.js
const initElven = async () => {
  const isLoggedIn = await ElvenJS.init({
    apiUrl: "https://devnet-api.elrond.com",
    chainType: "devnet",
    apiTimeout: 10000,
  });

  uiLoggedInState(isLoggedIn);
};

initElven();

// Login with Maiar mobile app button click listener
document
  .getElementById("button-login-mobile")
  .addEventListener("click", async () => {
    try {
      uiSpinnerState(true, "loginMobile");
      await ElvenJS.login("maiar-mobile", {
        qrCodeContainerId: "elrond-donate-widget-container",
        onWalletConnectLogin: () => {
          uiLoggedInState(true);
        },
        onWalletConnectLogout: () => {
          uiLoggedInState(false);
        },
      });
    } catch (e) {
      console.log("Login: Something went wrong, try again!", e?.message);
    } finally {
      uiSpinnerState(false, "loginMobile");
    }
  });

// Send donate transaction, define your address and the price
const egldTransferAddress =
  'erd17a4wydhhd6t3hhssvcp9g23ppn7lgkk4g2tww3eqzx4mlq95dukss0g50f';
const donatePrice = 0.5;

document.getElementById('button-tx').addEventListener('click', async () => {
  updateTxHashContainer(false);
  const demoMessage = 'Elrond donate demo!';

  const tx = new Transaction({
    nonce: ElvenJS.storage.get('nonce'),
    receiver: new Address(egldTransferAddress),
    gasLimit: 50000 + 1500 * demoMessage.length,
    chainID: 'D',
    data: new TransactionPayload(demoMessage),
    value: TokenPayment.egldFromAmount(donatePrice),
    sender: new Address(ElvenJS.storage.get('address')),
  });

  try {
    uiSpinnerState(true, 'egld');
    const transaction = await ElvenJS.signAndSendTransaction(tx);
    uiSpinnerState(false, 'egld');
    updateTxHashContainer(transaction.hash);
  } catch (e) {
    uiSpinnerState(false, 'egld');
    throw new Error(e?.message);
  }
});

// Logout
document.getElementById('button-logout').addEventListener('click', async () => {
  try {
    const isLoggedOut = await ElvenJS.logout();
    uiLoggedInState(!isLoggedOut);
  } catch (e) {
    console.error(e.message);
  }
});
