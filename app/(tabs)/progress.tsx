import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useProgressStore } from '@/stores/progressStore';
import { F } from '@/constants/Typography';
import { EXPERIENCE_COPY } from '@/config/experience';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProgressScreen() {
  const colors = useThemeColors();
  const t = useTypography();
  const progress = useProgressStore((s) => s.progress);
  const activeDay = Math.min(6, Math.max(0, new Date().getDay() === 0 ? 6 : new Date().getDay() - 1));
  const streakLength = Math.max(0, Math.min(7, progress.currentStreak));
  const streakMessage = progress.currentStreak > 0
    ? 'Keep showing up today to protect your streak.'
    : 'Open the app daily to build your first streak.';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: t.screenTitle }]}>Growth</Text>

        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {[
            { icon: 'bell',      title: 'Notifications', badge: '1', route: null },
            { icon: 'award',     title: 'Leaderboard',              route: '/leaderboard' as const },
            { icon: 'book-open', title: 'My library',               route: '/(tabs)/bookmarks' as const },
          ].map((item, index) => (
            <View key={item.title}>
              <Pressable onPress={() => item.route && router.push(item.route as any)} style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.backgroundAlt }]}>
                  <Feather name={item.icon as any} size={18} color={colors.text} />
                </View>
                <Text style={[styles.menuTitle, { color: colors.text, fontSize: t.cardTitle }]}>{item.title}</Text>
                {item.badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </Pressable>
              {index < 2 && <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />}
            </View>
          ))}
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text, fontSize: t.sectionTitle }]}>{EXPERIENCE_COPY.progress.streakTitle}</Text>
          <Text style={[styles.panelHint, { color: colors.textSecondary, fontSize: t.caption }]}>{streakMessage}</Text>
          <View style={styles.streakNumbers}>
            <View>
              <Text style={[styles.bigValue, { color: colors.text, fontSize: t.cardTitle }]}>{progress.currentStreak} days</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Total</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.bigValue, { color: colors.text, fontSize: t.cardTitle }]}>{Math.max(0, 2 - Math.min(2, progress.currentStreak))} freezes</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Left</Text>
            </View>
          </View>
          <View style={styles.weekRow}>
            {WEEK.map((label, index) => {
              const distance = (activeDay - index + 7) % 7;
              const active = distance < streakLength;
              return (
                <View key={`${label}-${index}`} style={styles.weekCell}>
                  <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{label}</Text>
                  <View style={[styles.weekBolt, { borderColor: active ? colors.warning : 'transparent' }]}>
                    <Feather name="zap" size={16} color={active ? colors.warning : colors.surfaceBorder} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.text, fontSize: t.sectionTitle }]}>{EXPERIENCE_COPY.progress.xpTitle}</Text>
          <View style={styles.streakNumbers}>
            <View>
              <Text style={[styles.bigValue, { color: colors.text, fontSize: t.cardTitle }]}>{progress.xp ?? 0}</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Last 30 days</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.bigValue, { color: colors.text, fontSize: t.cardTitle }]}>{progress.averageScore}%</Text>
              <Text style={[styles.subLabel, { color: colors.textSecondary, fontSize: t.caption }]}>Today</Text>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 36, gap: 14 },
  screenTitle: { fontFamily: F.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  menuCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontFamily: F.semiBold, fontSize: 15, flex: 1 },
  badge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontFamily: F.bold, fontSize: 12 },
  divider: { height: 1, marginHorizontal: 14 },
  panel: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 12 },
  panelTitle: { fontFamily: F.bold, fontSize: 17 },
  panelHint: { fontFamily: F.medium, fontSize: 12, lineHeight: 18, marginTop: -4 },
  streakNumbers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigValue: { fontFamily: F.bold, fontSize: 20 },
  subLabel: { fontFamily: F.regular, fontSize: 12, marginTop: 3 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCell: { alignItems: 'center', gap: 6 },
  weekLabel: { fontFamily: F.medium, fontSize: 11 },
  weekBolt: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  chartArea: { gap: 12, marginTop: 2 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chartAxisLabel: { width: 12, fontFamily: F.regular, fontSize: 11 },
  chartLine: { flex: 1, borderBottomWidth: 1, borderStyle: 'dotted' },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartFooterText: { fontFamily: F.regular, fontSize: 11 },
});
