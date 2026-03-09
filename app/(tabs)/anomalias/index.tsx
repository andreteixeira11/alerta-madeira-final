import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Construction, ChevronDown, MapPin, X } from 'lucide-react-native';
import FeedList from '@/components/FeedList';
import Colors from '@/constants/colors';
import { CONCELHOS } from '@/constants/freguesias';

interface AnomaliaHeaderProps {
  selectedFreguesia: string | null;
  onSelectFreguesia: (f: string | null) => void;
}

function AnomaliaHeader({ selectedFreguesia, onSelectFreguesia }: AnomaliaHeaderProps) {
  const [expandedConcelho, setExpandedConcelho] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectFreguesia = useCallback((freguesia: string) => {
    onSelectFreguesia(selectedFreguesia === freguesia ? null : freguesia);
    setShowPicker(false);
    setExpandedConcelho(null);
  }, [selectedFreguesia, onSelectFreguesia]);

  return (
    <View>
      <View style={styles.headerBanner}>
        <View style={styles.headerTop}>
          <Construction size={22} color="#B7950B" />
          <Text style={styles.headerText}>
            Está a ver um problema na sua freguesia? Publique aqui!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.freguesiaPicker}
          onPress={() => setShowPicker(!showPicker)}
          activeOpacity={0.7}
        >
          <MapPin size={14} color={Colors.textSecondary} />
          <Text style={styles.freguesiaPickerText} numberOfLines={1}>
            {selectedFreguesia ?? 'Filtrar por freguesia'}
          </Text>
          <ChevronDown
            size={14}
            color={Colors.textSecondary}
            style={{ transform: [{ rotate: showPicker ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {selectedFreguesia && (
          <TouchableOpacity
            style={styles.clearFilter}
            onPress={() => onSelectFreguesia(null)}
          >
            <X size={12} color={Colors.white} />
            <Text style={styles.clearFilterText}>Limpar filtro</Text>
          </TouchableOpacity>
        )}

        {showPicker && (
          <ScrollView style={styles.concelhoList} nestedScrollEnabled showsVerticalScrollIndicator>
            {CONCELHOS.map(concelho => (
              <View key={concelho.name}>
                <TouchableOpacity
                  style={styles.concelhoRow}
                  onPress={() => setExpandedConcelho(expandedConcelho === concelho.name ? null : concelho.name)}
                >
                  <Text style={styles.concelhoName}>{concelho.name}</Text>
                  <ChevronDown
                    size={12}
                    color={Colors.textMuted}
                    style={{ transform: [{ rotate: expandedConcelho === concelho.name ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>
                {expandedConcelho === concelho.name && (
                  <View style={styles.freguesiasList}>
                    {concelho.freguesias.map(f => (
                      <TouchableOpacity
                        key={f}
                        style={[
                          styles.freguesiaItem,
                          selectedFreguesia === f && styles.freguesiaItemActive,
                        ]}
                        onPress={() => handleSelectFreguesia(f)}
                      >
                        <Text style={[
                          styles.freguesiaItemText,
                          selectedFreguesia === f && styles.freguesiaItemTextActive,
                        ]}>
                          {f}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

export default function AnomaliasScreen() {
  const [selectedFreguesia, setSelectedFreguesia] = useState<string | null>(null);

  return (
    <FeedList
      category="anomalias"
      filterLocation={selectedFreguesia ?? undefined}
      ListHeaderComponent={
        <AnomaliaHeader
          selectedFreguesia={selectedFreguesia}
          onSelectFreguesia={setSelectedFreguesia}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  headerBanner: {
    backgroundColor: '#D4AC0D',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
    borderRadius: 14,
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
    lineHeight: 24,
  },
  freguesiaPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  freguesiaPickerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  clearFilter: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    gap: 4,
  },
  clearFilterText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '600' as const,
  },
  concelhoList: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 280,
    overflow: 'hidden',
  },
  concelhoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    gap: 6,
  },
  concelhoName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },

  freguesiasList: {
    paddingLeft: 12,
    backgroundColor: '#FAFAFA',
  },
  freguesiaItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  freguesiaItemActive: {
    backgroundColor: Colors.primaryPale,
  },
  freguesiaItemText: {
    fontSize: 13,
    color: Colors.text,
  },
  freguesiaItemTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});
