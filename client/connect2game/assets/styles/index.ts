import { StyleSheet, Dimensions } from "react-native";

export const PRIMARY_COLOR = "#7444C0";
export const SECONDARY_COLOR = "#5636B8";
export const WHITE = "#FFFFFF";
export const GRAY = "#757E90";
export const DARK_GRAY = "#363636";
export const BLACK = "#000000";

export const ONLINE_STATUS = "#46A575";
export const OFFLINE_STATUS = "#D04949";

export const STAR_ACTIONS = "#FFA200";
export const LIKE_ACTIONS = "#B644B2";
export const DISLIKE_ACTIONS = "#363636";
export const FLASH_ACTIONS = "#5028D7";

export const DIMENSION_WIDTH = Dimensions.get("window").width;
export const DIMENSION_HEIGHT = Dimensions.get("window").height;

export default StyleSheet.create({
  mediaContainer: {
    position: "relative",
    height: 400, 
    width: "100%",
  },
  photo: {
    height: "100%",
    width: "100%",
    resizeMode: "cover", 
  },
  video: {
    height: "100%",
    width: "100%",
    backgroundColor: "#000", 
  },
  leftTouchableArea: {
    position: "absolute",
    left: 0,
    width: "50%",
    height: "100%",
    zIndex: 1, 
  },
  rightTouchableArea: {
    position: "absolute",
    right: 0,
    width: "50%",
    height: "100%",
    zIndex: 1, 
  },
  progressIndicatorContainer: {
    position: "absolute",
    top: 5,
    width: "100%",
    alignItems: "center",
    zIndex: 10,
    paddingHorizontal: 10
  },


  fullRow: {
    paddingTop: 20,
    width: "100%", 
    alignItems: "center", 
    marginBottom: 10, 
  },
  centeredText: {
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333", 
    textAlign: "center", 
  },
  itemList: {
    flexDirection: "row",
    flexWrap: "wrap", 
    justifyContent: "center", 
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 10, 
    margin: 5, 
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    borderRadius: 20, 
    justifyContent: "center",
    alignItems: "center",
   
  },
  itemText: {
    fontSize: 11, 
    textAlign: "center",
    color: "#333", 
  },
  containerCardItem: {
    backgroundColor: WHITE,
    alignItems: "center",
    margin: 10,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowColor: BLACK,
    shadowOffset: { height: 20, width: 0 },
    position: "absolute",
    top: -50,
    width: "90%",
    height:500,

  },
  matchesCardItem: {
    marginTop: -35,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
    marginHorizontal: 30,
    textAlign: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  matchesTextCardItem: {
    color: WHITE,
    fontWeight: "bold",
    textAlign: "center",
  },
  descriptionCardItem: {
    color: GRAY,
    textAlign: "center",
    height: 60,
    paddingHorizontal: 15,
     justifyContent: "center"
  },
  actionsCardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 30,
    bottom: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: WHITE,
    marginHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowColor: DARK_GRAY,
    shadowOffset: { height: 10, width: 0 },
    bottom: 10,
  },
  miniButton: {
    width: 40,
    marginTop: 20,
    height: 40,
    borderRadius: 30,
    backgroundColor: WHITE,
    marginHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowColor: DARK_GRAY,
    shadowOffset: { height: 10, width: 0 },
  },



  containerMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
    paddingHorizontal: 10,
    width: DIMENSION_WIDTH - 100,
  },
  avatar: {
    borderRadius: 30,
    width: 60,
    height: 60,
    marginRight: 20,
    marginVertical: 15,
  },
  message: {
    color: GRAY,
    fontSize: 12,
    paddingTop: 5,
  },


  containerProfileItem: {
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingBottom: 25,
    margin: 20,
    borderRadius: 8,
    marginTop: -20,
    elevation: 1,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowColor: BLACK,
    shadowOffset: { height: 0, width: 0 },
  },
  matchesProfileItem: {
    
    marginTop: -15,
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: "center",
  },
  matchesTextProfileItem: {
    color: WHITE,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    flexWrap: "wrap",
  },
  descriptionContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  descriptionProfileItem: {
    color: GRAY,
    textAlign: "center",
    paddingBottom: 20,
    fontSize: 13,
    paddingTop:10
  },
  info: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  iconProfile: {
    fontSize: 12,
    color: DARK_GRAY,
    paddingHorizontal: 10,
  },
  infoContent: {
    color: GRAY,
    fontSize: 13,
    paddingRight: 15,
  },


  bg: {
    flex: 1,
    resizeMode: "cover",
    width: DIMENSION_WIDTH,
    height: DIMENSION_HEIGHT,
  },
  top: {
    paddingTop: 50,
    marginHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { paddingBottom: 10, fontSize: 22, color: DARK_GRAY },


  containerHome: {
    marginHorizontal: 10,
  },


  containerMessages: {
    justifyContent: "space-between",
    flex: 1,
    paddingHorizontal: 10,
  },

  containerProfile: { marginHorizontal: 0 },
  photo: {
    width: DIMENSION_WIDTH,
    height: 450,
  },
  settingsIconContainer: {
    position: "absolute", 
    top: 20, 
    right: 20, 
    zIndex: 10, 
  },


  iconMenu: {
    alignItems: "center",
  },


  logoutContainer: {
    position: 'absolute',
    top: 50,  
    right: 20, 
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    elevation: 5, 
    zIndex: 10,  
  },
  logout: {
    padding: 10,
  },
  logoutItem: {
    fontSize: 16,
    color: 'red',
    paddingVertical: 10,
    fontWeight: 'bold',
  },

  container: {
    marginTop: 50,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  loginButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginVertical: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  signupTextContainer: {
    marginTop: 10,
  },
  signupText: {
    color: "#3b5998",
    fontSize: 16,
    paddingBottom: 10,
  },


  introductioncontainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  introductioncontent: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  introductiontitle: {
    fontSize: 45,
    fontWeight: "bold",
    color: BLACK,
    marginBottom: 10,
  },
  introductionsubtitle: {
    fontSize: 16,
    color: GRAY,
    marginBottom: 55,
    textAlign: "center",
  },
  introductionbutton: {
    width: 150,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    marginBottom: 15,
  },
  introductionregisterButton: {
    backgroundColor: SECONDARY_COLOR,
  },
  introductionbuttonText: {
    fontSize: 15,
    color: WHITE,
    fontWeight: "bold",
  },

  introductionskipButton: {
    backgroundColor: SECONDARY_COLOR,
  },
  introductionskipbuttonText: {
    marginTop: 0,
    fontSize: 12,
    color: WHITE,
    fontWeight: "bold",
  },
  introductionskipbutton: {
    width: 100,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    alignSelf: "flex-end", 
    marginTop: 200,
    marginLeft: 250
  },
});
