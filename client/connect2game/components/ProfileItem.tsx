import React from "react";
import { Text, View } from "react-native";
import Icon from "./Icon";
import { ProfileItemT } from "../types";
import styles, { DARK_GRAY } from "../assets/styles";
import OptionalCategory from "./OptionalCategory";

const ProfileItem = ({
  info1,
  info2,
  info3,
  info4,
  info5,
  aboutMe,
  name,
  userId,
  width = 320,
}: ProfileItemT & { userId?: string; width?: string | number }) => (
  <View
    style={[
      styles.containerProfileItem,
      { width }, 
    ]}
  >
    <View style={styles.matchesProfileItem}>
      <Text style={styles.matchesTextProfileItem}>{name}</Text>
    </View>
    <View style={styles.descriptionContainer}>
      <Text style={styles.descriptionProfileItem}>{aboutMe}</Text>
    </View>

    <View style={styles.info}>
      <Text style={styles.iconProfile}>
        <Icon name="game-controller" size={14} color={DARK_GRAY} />
      </Text>
      <Text style={styles.infoContent}>{info1}</Text>
    </View>

    <View style={styles.info}>
      <Text style={styles.iconProfile}>
        <Icon name="calendar" size={14} color={DARK_GRAY} />
      </Text>
      <Text style={styles.infoContent}>{info2}</Text>
    </View>

    <View style={styles.info}>
      <Text style={styles.iconProfile}>
        <Icon name="person" size={14} color={DARK_GRAY} />
      </Text>
      <Text style={styles.infoContent}>{info3}</Text>
    </View>

    <View style={styles.info}>
      <Text style={styles.iconProfile}>
        <Icon type="MaterialCommunityIcons" name="gamepad-variant" size={14} color={DARK_GRAY} />
      </Text>
      <Text style={styles.infoContent}>{info4}</Text>
    </View>

    <View style={styles.fullRow}>
      <Text style={styles.centeredText}>Favorite Game of All Time</Text>

      <View style={styles.info}>
        <View style={styles.itemList}>
          {Array.isArray(info5) &&
            info5.map((filter, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemText}>{filter}</Text>
              </View>
            ))}
        </View>
      </View>
    </View>
    <OptionalCategory userId={userId} />
  </View>
);

export default ProfileItem;