import {
  Mnemonic,
  PrivateKey,
  Client,
  AccountCreateTransaction,
  AccountBalanceQuery,
  BadKeyError,
} from "@hashgraph/sdk";
import { get, writable } from "svelte/store";
import type { HederaAccountInfo } from "../interfaces/hedera.interfaces";

export class HederaService {
  hederaAccountInfo = writable<HederaAccountInfo>(
    JSON.parse(localStorage.getItem("hederaAccountInfo")) ?? "{}"
  );

  private client: Client;

  constructor() {
    this.hederaAccountInfo.subscribe((v) =>
      localStorage.setItem("hederaAccountInfo", JSON.stringify(v))
    );

    const { privateKey, accountId } = get(this.hederaAccountInfo);

    this.client = Client.forTestnet();

    if (!privateKey) {
      this.client.setOperator(
        "0.0.460923",
        "302e020100300506032b657004220420c6363cedb392f602bcebf78edfb0541812534f492f4d367e32939d7247705884"
      );
    } else {
      try {
        this.client.setOperator(accountId, privateKey);
      } catch (e) {
        if (e instanceof BadKeyError) {
          this.hederaAccountInfo.update((info) => ({ ...info, privateKey: undefined }));
        }
      }
    }
  }

  async generateMnemonic() {
    return (await Mnemonic.generate12()).toString();
  }

  async generateKeyPairs(mnemonic: string) {
    const privateKey = await PrivateKey.fromMnemonic(mnemonic);
    return { privateKey: privateKey.toString(), publicKey: privateKey.publicKey.toString() };
  }

  async createAccount(privateKey: string, publicKey: string) {
    const transaction = await new AccountCreateTransaction()
      .setKey(PrivateKey.fromString(privateKey).publicKey)
      .setInitialBalance(0)
      .execute(this.client);

    const receipt = await transaction.getReceipt(this.client);
    const accountId = receipt.accountId.toString();
    this.hederaAccountInfo.set({ accountId, privateKey, publicKey });

    return accountId;
  }

  async fetchBalance() {
    if (!get(this.hederaAccountInfo).accountId) {
      return { hbars: 0 };
    }

    return new AccountBalanceQuery()
      .setAccountId(get(this.hederaAccountInfo).accountId)
      .execute(this.client);
  }

  async importPrivateKey(privateKey: string) {
    this.hederaAccountInfo.update((info) => ({
      ...info,
      privateKey,
    }));
  }

  async exportPrivateKey() {
    const uri =
      "data:application/octet-stream," + encodeURIComponent(get(this.hederaAccountInfo).privateKey);
    window.open(uri, "neuesDokument");
  }
}
