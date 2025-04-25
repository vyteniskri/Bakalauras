import React from "react";
import { View } from "react-native";
import Icon from "./Icon";
import styles, { DARK_GRAY, PRIMARY_COLOR } from "../assets/styles";
import { TabBarIconT } from "../types";

const TabBarIcon = ({ focused, iconName, text, typ }: TabBarIconT) => {
  const iconFocused = focused ? PRIMARY_COLOR : DARK_GRAY;

  return (
    <View style={styles.iconMenu}>
      <Icon name={iconName} type={typ} size={16} color={iconFocused} />
     
    </View>
  );
};

export default TabBarIcon;
