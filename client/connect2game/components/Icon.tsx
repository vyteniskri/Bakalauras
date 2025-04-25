import React from "react";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { IconT } from "../types";

const Icon = ({ color, name, size, style, type = "Ionicons" }: IconT) => {
  const IconComponent =
    type === "AntDesign"
      ? AntDesign
      : type === "MaterialCommunityIcons"
      ? MaterialCommunityIcons
      : type === "Foundation"
      ? MaterialCommunityIcons
      : type === "FontAwesome5"
      ? FontAwesome5
      : Ionicons;
  return <IconComponent name={name} size={size} color={color} style={style} />;
};

export default Icon;
