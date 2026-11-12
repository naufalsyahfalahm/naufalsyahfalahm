import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// Headings: Space Grotesk. Body: Inter. Rendering waits until both are loaded.
loadSpaceGrotesk("normal", { weights: ["500", "700"], subsets: ["latin"] });
loadInter("normal", { weights: ["400", "600"], subsets: ["latin"] });
