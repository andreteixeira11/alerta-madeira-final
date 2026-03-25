import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { Fuel, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useFuelPrices } from '@/hooks/usePosts';

const FUEL_FALLBACK = [
  { id: '1', fuel_type: 'Gasolina 95', price: '1.659', trend: 'stable' as const, updated_at: '' },
  { id: '2', fuel_type: 'Gasóleo', price: '1.549', trend: 'stable' as const, updated_at: '' },
  { id: '3', fuel_type: 'GPL Auto', price: '0.749', trend: 'stable' as const, updated_at: '' },
];

const FUEL_ICONS: Record<string, string> = {
  'Gasolina 95': '⛽',
  'Gasóleo': '🛢️',
  'GPL Auto': '🔋',
};

const TREND_LABELS: Record<string, string> = {
  up: 'A subir',
  down: 'A descer',
  stable: 'Estável',
};

function getCurrentWeekRange(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (d: Date) =>
    `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  return `${format(monday)} - ${format(sunday)}`;
}

function FuelItem({ fuel, index }: { fuel: { id: string; fuel_type: string; price: string; trend: 'up' | 'down' | 'stable' }; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const trendColor = fuel.trend === 'up' ? Colors.danger : fuel.trend === 'down' ? Colors.success : Colors.textMuted;
  const trendBg = fuel.trend === 'up' ? '#FEF2F2' : fuel.trend === 'down' ? '#F0FDF4' : '#F9FAFB';
  const emoji = FUEL_ICONS[fuel.fuel_type] ?? '⛽';

  return (
    <Animated.View style={[styles.fuelItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.fuelItemLeft}>
        <Text style={styles.fuelEmoji}>{emoji}</Text>
        <View>
          <Text style={styles.fuelType}>{fuel.fuel_type}</Text>
          <View style={[styles.trendBadge, { backgroundColor: trendBg }]}>
            {fuel.trend === 'up' && <TrendingUp size={10} color={trendColor} />}
            {fuel.trend === 'down' && <TrendingDown size={10} color={trendColor} />}
            {fuel.trend === 'stable' && <Minus size={10} color={trendColor} />}
            <Text style={[styles.trendText, { color: trendColor }]}>{TREND_LABELS[fuel.trend]}</Text>
          </View>
        </View>
      </View>
      <View style={styles.fuelItemRight}>
        <Text style={styles.fuelPrice}>{fuel.price}</Text>
        <Text style={styles.fuelUnit}>€/L</Text>
      </View>
    </Animated.View>
  );
}

export default React.memo(function WeatherFuelCards() {
  const [expanded, setExpanded] = useState(false);
  const { data: dbFuelPrices } = useFuelPrices();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleExpanded = useCallback(() => {
    const nextVal = !expanded;
    Animated.timing(rotateAnim, {
      toValue: nextVal ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setExpanded(nextVal);
  }, [expanded, rotateAnim]);

  const fuelList = dbFuelPrices && dbFuelPrices.length > 0 ? dbFuelPrices : FUEL_FALLBACK;
  const weekRange = useMemo(() => getCurrentWeekRange(), []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={toggleExpanded}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Fuel size={20} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Combustíveis</Text>
              <Text style={styles.cardSubtitle}>Semana {weekRange}</Text>
            </View>
          </View>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <ChevronRight size={20} color={Colors.textSecondary} />
          </Animated.View>
        </View>

        {!expanded && (
          <View style={styles.previewRow}>
            {fuelList.slice(0, 3).map(fuel => {
              const trendColor = fuel.trend === 'up' ? Colors.danger : fuel.trend === 'down' ? Colors.success : Colors.textMuted;
              return (
                <View key={fuel.id} style={styles.previewItem}>
                  <Text style={styles.previewType} numberOfLines={1}>{fuel.fuel_type}</Text>
                  <View style={styles.previewPriceRow}>
                    <Text style={styles.previewPrice}>{fuel.price}€</Text>
                    {fuel.trend === 'up' && <TrendingUp size={11} color={trendColor} />}
                    {fuel.trend === 'down' && <TrendingDown size={11} color={trendColor} />}
                    {fuel.trend === 'stable' && <Minus size={11} color={trendColor} />}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {fuelList.map((fuel, i) => (
            <FuelItem key={fuel.id} fuel={fuel} index={i} />
          ))}
          <Text style={styles.disclaimer}>Preços médios na Região Autónoma da Madeira</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden' as const,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  previewRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  previewItem: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  previewType: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  previewPrice: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  expandedContent: {
    backgroundColor: Colors.card,
    marginTop: 2,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fuelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  fuelItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fuelEmoji: {
    fontSize: 28,
  },
  fuelType: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  fuelItemRight: {
    alignItems: 'flex-end',
  },
  fuelPrice: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  fuelUnit: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  disclaimer: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 10,
  },
});
