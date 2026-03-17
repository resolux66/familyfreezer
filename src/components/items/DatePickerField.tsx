import { useState } from 'react';

import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';

import { formatDate } from '@/utils/dates';

// 📘 React Native Note — @react-native-community/datetimepicker
// React Native has no built-in date picker. This community package uses the
// NATIVE platform picker on each OS:
//   iOS   → inline spinner wheel (rendered directly in the form, always visible)
//   Android → a modal dialog that appears when triggered (requires a button tap)
//
// Because they behave differently, we handle them separately:
//   iOS   → show the picker inline below the field when tapped
//   Android → show the picker only when showPicker state is true
//
// We store dates as ISO strings (in Appwrite format), not Date objects,
// so parseISO() and toISOString() are used to convert at the boundary.

interface Props {
  label:       string;
  value:       string | null | undefined;
  onChange:    (iso: string | null) => void;
  required?:   boolean;
  hasError?:   boolean;
  minDate?:    Date;
  clearable?:  boolean;
}

export function DatePickerField({
  label,
  value,
  onChange,
  required,
  hasError,
  minDate,
  clearable = true,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const dateValue = value ? parseISO(value) : new Date();

  // ── Web: use native HTML date input ───────────────────────────────────────
  if (Platform.OS === 'web') {
    const htmlValue = value ? format(parseISO(value), 'yyyy-MM-dd') : '';
    return (
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-sm font-medium text-gray-600">
            {label}{required && <Text className="text-danger"> *</Text>}
          </Text>
          {value && clearable && (
            <Pressable onPress={() => onChange(null)}>
              <Text className="text-xs text-gray-400">Clear</Text>
            </Pressable>
          )}
        </View>
        {/* @ts-ignore — input is valid on web */}
        <input
          type="date"
          value={htmlValue}
          min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.value) {
              onChange(new Date(e.target.value).toISOString());
            } else {
              onChange(null);
            }
          }}
          style={{
            border: hasError ? '1px solid #DC2626' : '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 16,
            width: '100%',
            backgroundColor: hasError ? '#FEF2F2' : '#fff',
            boxSizing: 'border-box',
          }}
        />
        {hasError && (
          <Text className="text-danger text-xs mt-1">{label} is required.</Text>
        )}
      </View>
    );
  }

  function handleChange(_event: DateTimePickerEvent, selected?: Date) {
    // Android fires onChange AND closes the picker in one event
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) onChange(selected.toISOString());
  }

  // ── iOS: picker is always inline when open ────────────────────────────────
  if (Platform.OS === 'ios') {
    return (
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-sm font-medium text-gray-600">
            {label}{required && <Text className="text-danger"> *</Text>}
          </Text>
          {value && clearable && (
            <Pressable onPress={() => onChange(null)}>
              <Text className="text-xs text-gray-400">Clear</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          className={`border rounded-xl px-4 py-3 flex-row items-center justify-between ${
            hasError ? 'border-danger bg-danger-pale' : 'border-surface-border bg-white'
          }`}
          onPress={() => setShowPicker((v) => !v)}
        >
          <Text className={value ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
            {value ? formatDate(value) : 'Select date…'}
          </Text>
          <Text className="text-gray-400 text-xs">{showPicker ? '▲' : '▼'}</Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="inline"
            onChange={handleChange}
            minimumDate={minDate}
            themeVariant="light"
          />
        )}
        {hasError && (
          <Text className="text-danger text-xs mt-1">{label} is required.</Text>
        )}
      </View>
    );
  }

  // ── Android: modal dialog triggered by button tap ─────────────────────────
  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-medium text-gray-600">
          {label}{required && <Text className="text-danger"> *</Text>}
        </Text>
        {value && clearable && (
          <Pressable onPress={() => onChange(null)}>
            <Text className="text-xs text-gray-400">Clear</Text>
          </Pressable>
        )}
      </View>
      <Pressable
        className={`border rounded-xl px-4 py-3 ${
          hasError ? 'border-danger bg-danger-pale' : 'border-surface-border bg-white'
        }`}
        onPress={() => setShowPicker(true)}
      >
        <Text className={value ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
          {value ? formatDate(value) : 'Tap to select date…'}
        </Text>
      </Pressable>
      {hasError && (
        <Text className="text-danger text-xs mt-1">{label} is required.</Text>
      )}
      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minDate}
        />
      )}
    </View>
  );
}
