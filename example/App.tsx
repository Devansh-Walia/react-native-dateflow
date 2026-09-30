/**
 * Parity screen. Every value is fixed (Sep 2026, 14:45) so iOS / Android / Web
 * screenshots can be compared pixel for pixel.
 */
import './global.css';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type TextStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Calendar, DatePicker, DateTimePicker, TimePicker, type DateRange } from 'react-native-dateflow';

const SEP_2026 = new Date(2026, 8, 1);
const FIXED = new Date(2026, 8, 29, 14, 45);

/**
 * Identical to the library's internal TEXT_RESET (not part of the public API):
 * removes Android font padding so glyph boxes match iOS/web.
 */
const TEXT_RESET: TextStyle =
  Platform.select<TextStyle>({
    android: { includeFontPadding: false, textAlignVertical: 'center' },
    default: {},
  }) ?? {};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text style={TEXT_RESET} className="text-xs font-semibold uppercase text-muted-foreground">
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function App() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [single, setSingle] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [time, setTime] = useState<Date>(FIXED);
  const [date, setDate] = useState<Date | null>(FIXED);
  const [when, setWhen] = useState<Date | null>(FIXED);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {/* ScrollView only holds the demo page; the library itself never uses one. */}
      <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-4 pb-16 pt-14">
        <View className="flex-row items-center justify-between">
          <Text style={TEXT_RESET} className="text-xl font-semibold text-foreground">
            dateflow parity
          </Text>
          <Pressable testID="toggle-theme" onPress={toggleColorScheme} className="select-none rounded-lg border border-border px-3 py-2">
            <Text style={TEXT_RESET} className="text-sm text-foreground">
              {colorScheme === 'dark' ? 'Light' : 'Dark'}
            </Text>
          </Pressable>
        </View>

        <Section title="Calendar · single">
          <Calendar defaultMonth={SEP_2026} value={single} onChange={setSingle} testID="calendar" />
        </Section>

        <Section title="Calendar · range">
          <Calendar mode="range" defaultMonth={SEP_2026} value={range} onChange={setRange} testID="range" />
        </Section>

        <Section title="TimePicker · wheel 12h">
          <TimePicker value={time} onChange={setTime} testID="wheel" />
        </Section>

        <Section title="TimePicker · inline 24h / 15 min">
          <TimePicker variant="inline" hourFormat="24h" minuteStep={15} value={time} onChange={setTime} testID="inline" />
        </Section>

        <Section title="DatePicker · sheet">
          <DatePicker presentation="sheet" value={date} onChange={setDate} testID="date-picker" />
        </Section>

        <Section title="DateTimePicker · tabs">
          <DateTimePicker value={when} onChange={setWhen} minuteStep={5} testID="dtp" />
        </Section>
      </ScrollView>
    </GestureHandlerRootView>
  );
}
