import { staticFile } from "remotion";
import { ASSETS, type AssetInfo } from "../generated/assets";

export const assetInfo = (path: string): AssetInfo => ASSETS[path] ?? { exists: false };
export const hasAsset = (path: string) => assetInfo(path).exists;
export const src = (path: string) => staticFile(path);
