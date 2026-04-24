import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyTokenModule", (m) => {
  const myToken = m.contract("MyToken", [
    "MyToken",               // token name
    "MTK",                   // token symbol
    BigInt(1000 * 10 ** 18), // initial supply: 1000 tokens
  ]);

  return { myToken };
});
