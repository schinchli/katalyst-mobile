import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useProgressStore } from '@/stores/progressStore';
import { F } from '@/constants/Typography';
import { EXPERIENCE_COPY } from '@/config/experience';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProgressScreen() {
  const colors = useThemeColors();
  const progress = useProgressStore((s) => s.progress);
  const activeDay = Math.min(6, Math.max(0, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));
  const streakLength = Math.max(0, Math.min(7, progress.currentStreak));
  const streakMessage = progress.currentStreak > 0
    ? 'Keep showing up today to protect your streak.'
    : 'Open the app daily to build your first streak.';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Growth</Text>

        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {[
            { icon: 'bell', title: 'Notifications', badge: '1' },
            { icon: 'award', title: 'Leaderboard' },
            { icon: 'book-open', title: 'My library' },
          ].map((item, index) => (
            <View key={item.title}>
              <View style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.backgroundAlt }]}>
                  <Feather name={item.icon as any} size={18} color={colors.text} />
                </View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                {item.badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </View>
              {index < 2 && <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />}
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>{EXPERIENCE_COPY.progress.streakTitle}</Text>
          <Text style={[styles.panelHint, { color: colors.textSecondary }]}>{streakMessage}</Text>
          <View style={styles.streakNumbers}>
            <View>
              <Text style={[styles.bigValue, { color: colors.text }]}>{progress.currentStreak} days</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.bigValue, { color: colors.text }]}>{Math.max(0, 2 - Math.min(2, progress.currentStreak))} freezes</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Left</Text>
            </View>
          </View>
          <View style={styles.weekRow}>
            {WEEK.map((label, index) => {
              const distance = (activeDay - index + 7) % 7;
              const active = distance < streakLength;
              return (
                <View key={`${label}-${index}`} style={styles.weekCell}>
                  <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{label}</Text>
                  <View style={[styles.weekBolt, { borderColor: active ? '#F8E84A' : 'transparent' }]}>
                    <Feather name="zap" size={20} color={active ? '#F8E84A' : '#223A70'} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text }]}>{EXPERIENCE_COPY.progress.xpTitle}</Text>
          <View style={styles.streakNumbers}>
            <View>
              <Text style={[styles.bigValue, { color: colors.text }]}>{progress.xp ?? 0}</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Last 30 days</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.bigValue, { color: colors.text }]}>{progress.averageScore}%</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Today</Text>
            </View>
          </View>
          <View style={styles.chartArea}>
            {Array.from({ length: 5 }).map((_, row) => (
              <View key={row} style={styles.chartRow}>
                <Text style={[styles.chartAxisLabel, { color: colors.textSecondary }]}>1</Text>
                <View style={[styles.chartLine, { borderColor: colors.surfaceBorder }]} />
              </View>
            ))}
          </View>
          <View style={styles.chartFooter}>
            <Text style={[styles.chartFooterText, { color: colors.textSecondary }]}>09 February</Text>
            <Text style={[styles.chartFooterText, { color: colors.textSecondary }]}>Today</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 36, gap: 18 },
  screenTitle: { fontFamily: F.bold, fontSize: 34, lineHeight: 40, letterSpacing: -1.1 },
  menuCard: { borderWidth: 1, borderRadius: 28, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 18 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontFamily: F.semiBold, fontSize: 18, flex: 1 },
  badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#04111F', fontFamily: F.bold, fontSize: 16 },
  divider: { height: 1, marginHorizontal: 16 },
  panel: { borderWidth: 1, borderRadius: 28, padding: 18, gap: 16 },
  panelTitle: { fontFamily: F.bold, fontSize: 18 },
  panelHint: { fontFamily: F.medium, fontSize: 13, lineHeight: 20, marginTop: -6 },
  streakNumbers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigValue: { fontFamily: F.bold, fontSize: 22 },
  subLabel: { fontFamily: F.regular, fontSize: 14, marginTop: 4 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCell: { alignItems: 'center', gap: 10 },
  weekLabel: { fontFamily: F.medium, fontSize: 13 },
  weekBolt: { width: 52, height: 52, borderRadius: 26, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  chartArea: { gap: 16, marginTop: 4 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chartAxisLabel: { width: 14, fontFamily: F.regular, fontSize: 14 },
  chartLine: { flex: 1, borderBottomWidth: 1, borderStyle: 'dotted' },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartFooterText: { fontFamily: F.regular, fontSize: 13 },
});
