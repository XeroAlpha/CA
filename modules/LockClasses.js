Loader.lockMethods(CA.Library);
Loader.lockProperty(CA, "Library");
Loader.lockMethods(CA, ["showDonate", "showDonateDialog"]);
Loader.freezeFields(Updater, ["sources", "betaSources"]);
Loader.protectMethods(MapScript.global, "UserManager", ["getSettingItem", "processUriAction", "initialize"]);