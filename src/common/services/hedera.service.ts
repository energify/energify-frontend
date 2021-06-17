import {
  Mnemonic,
  PrivateKey,
  Client,
  AccountCreateTransaction,
  AccountBalanceQuery,
  TransferTransaction,
  Hbar,
  HbarUnit,
  AccountId,
} from "@hashgraph/sdk";

import { get, writable } from "svelte/store";
import { i2hex } from "../misc.util";

export class HederaService {
  private privateKey = writable(localStorage.getItem("privateKey") ?? "");
  private balance = writable("");
  private client: Client;

  constructor() {
    this.privateKey.subscribe((v) => localStorage.setItem("privateKey", v));
  }

  initClient() {
    this.client = Client.forTestnet();
    let hederaAccountId = localStorage.getItem("hederaAccountId");

    try {
      AccountId.fromString(hederaAccountId);
    } catch (e) {
      hederaAccountId = null;
    }

    if (get(this.privateKey) === "" || !hederaAccountId) {
      this.client.setOperator(
        "0.0.460923",
        "302e020100300506032b657004220420c6363cedb392f602bcebf78edfb0541812534f492f4d367e32939d7247705884"
      );
    } else {
      this.client.setOperator(hederaAccountId, get(this.privateKey));
    }
  }

  async generateMnemonic() {
    return (await Mnemonic.generate12()).toString();
  }

  async createAccount(mnemonic: string) {
    const privateKey = await PrivateKey.fromMnemonic(mnemonic);
    this.privateKey.set(privateKey.toString());
    const transaction = await new AccountCreateTransaction()
      .setKey(PrivateKey.fromString(privateKey.toString()).publicKey)
      .setInitialBalance(15)
      .execute(this.client);
    const receipt = await transaction.getReceipt(this.client);
    return receipt.accountId.toString();
  }

  async fetchBalance() {
    const hederaAccountId = localStorage.getItem("hederaAccountId");
    if (get(this.privateKey) === "") {
      this.balance.set("0");
      return;
    }
    const { hbars } = await new AccountBalanceQuery()
      .setAccountId(hederaAccountId)
      .execute(this.client);
    this.balance.set(hbars.to(HbarUnit.Millibar).toString());
  }

  importPrivateKey(privateKey: string) {
    try {
      const hederaAccountId = localStorage.getItem("hederaAccountId");
      this.client.setOperator(hederaAccountId, privateKey);
      this.privateKey.set(privateKey);
    } catch (e) {
      console.log(e);
      throw new Error("Private key is not valid.");
    }
  }

  async exportPrivateKey() {
    const uri = "data:application/octet-stream," + encodeURIComponent(get(this.privateKey));
    window.open(uri, "neuesDokument");
  }

  async transfer(toAccountId: string, amount: number) {
    const hederaAccountId = localStorage.getItem("hederaAccountId");
    const millibarAmount = Hbar.from(parseFloat(amount.toFixed(5)), HbarUnit.Millibar);
    const transaction = await new TransferTransaction()
      .addHbarTransfer(toAccountId, millibarAmount)
      .addHbarTransfer(hederaAccountId, millibarAmount.negated())
      .execute(this.client);
    const { status } = await transaction.getReceipt(this.client);
    return {
      status,
      hash: Array.from(transaction.transactionHash)
        .map((i) => i2hex(i))
        .join(""),
    };
  }

  getPrivateKey() {
    return this.privateKey;
  }

  getBalance() {
    return this.balance;
  }
}

export const hederaService = new HederaService();
