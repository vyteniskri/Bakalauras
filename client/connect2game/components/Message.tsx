import React from "react";
import { Text, View, Image } from "react-native";
import { MessageT } from "../types";
import styles from "../assets/styles";

const Message = ({ image, lastMessage, name }: MessageT) => (
  <View style={styles.containerMessage}>
    <Image source={{uri: image}} style={styles.avatar} />
    <View>
      <Text>{name}</Text>
      <Text style={styles.message} numberOfLines={3} ellipsizeMode="tail">
           {lastMessage}
      </Text>
    </View>
  </View>
);

export default Message;
