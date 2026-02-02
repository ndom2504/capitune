import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as DocumentPicker from 'expo-document-picker';
import { getConversations, getMessages, sendMessage, resolveUrl } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function InsideScreen() {
  const { width } = useWindowDimensions();
  const isSmall = width < 720;
  const [token] = useState(process.env.EXPO_PUBLIC_TEST_TOKEN || null); // supply JWT here for testing
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getConversations(token);
        setConversations(data.conversations || []);
      } catch (e) {
        setError(`Conversations: ${e.message}`);
      }
    })();
  }, []);

  const openThread = async (thread) => {
    setSelected(thread);
    try {
      const data = await getMessages(thread._id, token);
      setMessages(data.messages || []);
    } catch (e) {
      setError(`Messages: ${e.message}`);
    }
  }

  const onSend = async () => {
    if (!selected || !input.trim()) return;
    try {
      await sendMessage(selected._id, input.trim(), token);
      setInput('');
      const data = await getMessages(selected._id, token);
      setMessages(data.messages || []);
    } catch (e) {
      setError(`Envoi: ${e.message}`);
    }
  }

  const sendQuick = async (text) => {
    if (!selected) return;
    try {
      await sendMessage(selected._id, text, token);
      const data = await getMessages(selected._id, token);
      setMessages(data.messages || []);
    } catch (e) {
      setError(`Action: ${e.message}`);
    }
  }

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res?.assets?.[0]) {
      const f = res.assets[0];
      const sizeKb = Math.max(1, Math.round((f.size || 0) / 1024));
      await sendQuick(`📎 ${f.name} (${sizeKb} Ko)`);
    }
  }

  return (
    <View style={[styles.container, isSmall && styles.containerMobile]}>
      <StatusBar style="dark" />
      {error && (
        <View style={{ padding: 8, backgroundColor: '#fee2e2' }}>
          <Text style={{ color: '#991b1b' }}>{error}</Text>
        </View>
      )}
      <View style={[styles.list, isSmall && styles.listMobile]}>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => openThread(item)}>
              <View style={styles.avatar}>
                {item.participants?.[0]?.avatar ? (
                  <Image source={{ uri: resolveUrl(item.participants[0].avatar) }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                ) : (
                  <Ionicons name="person-circle-outline" size={36} color="#6b7280" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.participants?.[0]?.username || 'Utilisateur'}</Text>
                <Text style={styles.preview}>{item.lastMessage || 'Aucun message'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={[styles.chat, isSmall && styles.chatMobile]}>
        <FlatList
          data={messages}
          keyExtractor={(_, idx) => String(idx)}
          renderItem={({ item }) => (
            <View style={[styles.msg, item.isSystemMessage ? styles.system : styles.user]}>
              <Text>{item.content}</Text>
            </View>
          )}
        />
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Écrire un message..."
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={onSend}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => sendQuick('🔊 Demande d\'appel audio privée')}>
              <Ionicons name="call-outline" size={18} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => sendQuick('🎥 Demande d\'appel vidéo privée')}>
              <Ionicons name="videocam-outline" size={18} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={pickFile}>
              <Ionicons name="attach-outline" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
            <Ionicons name="send-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', flexDirection: 'row' },
  containerMobile: { flexDirection: 'column' },
  list: { width: '40%', backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  listMobile: { width: '100%', borderRightWidth: 0, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', maxHeight: 280 },
  item: { flexDirection: 'row', gap: 12, padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '700' },
  preview: { color: '#6b7280' },
  chat: { flex: 1, backgroundColor: '#fff' },
  chatMobile: { flex: 1 },
  msg: { padding: 10, margin: 8, borderRadius: 8, backgroundColor: '#f9fafb' },
  system: { backgroundColor: '#fff1f2' },
  user: { backgroundColor: '#eef2ff' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 36, height: 36, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 40, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f28c5a' }
});
