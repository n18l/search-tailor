import { getUserData } from "./addonFunctions";
import TailoredSearch from "./TailoredSearch";

getUserData().then(() => new TailoredSearch());
