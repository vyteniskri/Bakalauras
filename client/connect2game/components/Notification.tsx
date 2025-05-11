import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import axiosInstance from "./axiosInstance";
import Icon from "./Icon";
import { GRAY, PRIMARY_COLOR, WHITE } from "../assets/styles";

const Notification = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    if (visible) {
      const fetchNotifications = async () => {
        try {
          setLoading(true);

          const reportsResponse = await axiosInstance.get(`/reports/Once`);
          const reportId = reportsResponse.data.id;

          const warningsResponse = await axiosInstance.get(`warnings/${reportId}`);
          const warningData = warningsResponse.data;

          setWarnings(warningData);

          if (warningData.creationDate) {
            const creationDate = new Date(warningData.creationDate).getTime();
            const expirationDate = creationDate + 24 * 60 * 60 * 1000; 
            const now = Date.now();
            const timeRemaining = expirationDate - now;

            if (timeRemaining > 0) {
              const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
              const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);

              setCountdown(`${hours}h ${minutes}m`);
            } else {
              setCountdown("Expired");
            }
          }
        } catch (error) {
        } finally {
          setLoading(false);
        }
      };

      fetchNotifications();
    }
  }, [visible]);

  useEffect(() => {
    if (warnings?.creationDate) {
      const interval = setInterval(() => {
        const creationDate = new Date(warnings.creationDate).getTime();
        const expirationDate = creationDate + 24 * 60 * 60 * 1000;
        const now = Date.now();
        const timeRemaining = expirationDate - now;

        if (timeRemaining > 0) {
          const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);

          setCountdown(`${hours}h ${minutes}m`);
        } else {
          setCountdown("Expired");
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [warnings]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          ) : (
            <>
              <TouchableOpacity onPress={onClose} style={{ alignSelf: "flex-end" }}>
                <Icon name="close-circle" size={30} color={PRIMARY_COLOR} />
              </TouchableOpacity>
              <Text style={styles.title}>Warning</Text>
              {warnings?.text ? (
                <View style={{ alignItems: "center", backgroundColor: WHITE, padding: 10, borderRadius: 5 }}>
                  <Text style={styles.notificationText}>Time Remaining: <Text style={styles.notificationTime}>{countdown}</Text></Text>
                  <Text style={styles.notificationText}>{warnings.text}</Text>
                </View>
              ) : (
                <Text style={styles.notificationText}>You're all good! 😊</Text>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  notificationText: {
    fontSize: 16,
    marginVertical: 5,
  },
  notificationTime: {
    fontSize: 18,
    marginVertical: 5,
    color: PRIMARY_COLOR,
  },
});

export default Notification;