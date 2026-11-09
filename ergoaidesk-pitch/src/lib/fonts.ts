import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// Headings and numbers: Space Grotesk. Body and captions: Inter. Both block rendering until loaded.
const sg = loadSpaceGrotesk("normal", { weights: ["500", "700"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const HEADING = sg.fontFamily;
export const BODY = inter.fontFamily;
