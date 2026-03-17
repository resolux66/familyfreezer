import { useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { isBefore, startOfDay } from 'date-fns';

import { DatePickerField } from './DatePickerField';
import type { ApplianceType, CreateItemInput, Item } from '@/types';
import { hapticError, hapticSuccess } from '@/utils/haptics';

// 📘 React Native Note — Curried updater pattern
// Instead of writing a separate onChange handler for every field, we use a
// factory function: update('name') returns a handler that updates just 'name'
// in state. This is called "currying" — a function that returns another
// function. It removes repetitive boilerplate and keeps the JSX clean:
//   onChangeText={update('name')}   ← much shorter than:
//   onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}

interface FormState {
  name:        string;
  quantity:    string;
  bestBefore:  string | null;
  useBy:       string | null;
  notes:       string;
}

interface Props {
  applianceType: ApplianceType;
  initialValues?: Partial<FormState>;
  submitLabel:    string;
  isSubmitting:   boolean;
  onSubmit:       (input: CreateItemInput) => void;
  onCancel:       () => void;
}

export function ItemForm({
  applianceType,
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: Props) {
  const isFridge = applianceType === 'fridge';

  const [form, setForm] = useState<FormState>({
    name:       initialValues?.name        ?? '',
    quantity:   initialValues?.quantity    ?? '',
    bestBefore: initialValues?.bestBefore  ?? null,
    useBy:      initialValues?.useBy       ?? null,
    notes:      initialValues?.notes       ?? '',
  });

  // Validation errors — only shown after the user tries to submit
  const [touched, setTouched] = useState(false);

  // 📘 React Native Note — Curried updater factory
  function update<K extends keyof FormState>(field: K) {
    return (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  const errors = {
    name:  touched && !form.name.trim()          ? 'Name is required.' : null,
    useBy: touched && isFridge && !form.useBy    ? 'Use By date is required for fridge items.' : null,
  };

  // Warning (not an error) — past use-by date is technically valid (expired item)
  const useByInPast =
    isFridge && form.useBy
      ? isBefore(new Date(form.useBy), startOfDay(new Date()))
      : false;

  function handleSubmit() {
    setTouched(true);
    if (!form.name.trim()) { hapticError(); return; }
    if (isFridge && !form.useBy) { hapticError(); return; }

    hapticSuccess(); // Reward the user — item is being saved
    onSubmit({
      name:       form.name.trim(),
      quantity:   form.quantity.trim(),
      bestBefore: isFridge ? null      : (form.bestBefore ?? null),
      useBy:      isFridge ? form.useBy : null,
      notes:      form.notes.trim() || null,
    } as CreateItemInput);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-5 pb-4 border-b border-surface-border">
        <Pressable onPress={onCancel}>
          <Text className="text-gray-500 text-base">Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting
            ? <ActivityIndicator color="#1A3A5C" size="small" />
            : <Text className="text-brand-light font-semibold text-base">{submitLabel}</Text>
          }
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
      >
        {/* Name — required for all */}
        <Text className="text-sm font-medium text-gray-600 mb-2">
          Item Name <Text className="text-danger">*</Text>
        </Text>
        <TextInput
          className={`border rounded-xl px-4 py-3 mb-1 text-base ${
            errors.name ? 'border-danger bg-danger-pale' : 'border-surface-border'
          }`}
          placeholder="e.g. Chicken breasts"
          value={form.name}
          onChangeText={update('name')}
          autoFocus
        />
        {errors.name ? (
          <Text className="text-danger text-xs mb-3">{errors.name}</Text>
        ) : <View className="mb-3" />}

        {/* Quantity */}
        <Text className="text-sm font-medium text-gray-600 mb-2">Quantity</Text>
        <TextInput
          className="border border-surface-border rounded-xl px-4 py-3 mb-4 text-base"
          placeholder="e.g. 2 portions, 500g"
          value={form.quantity}
          onChangeText={update('quantity')}
        />

        {/* Date fields — depend on appliance type */}
        {isFridge ? (
          <>
            <DatePickerField
              label="Use By"
              value={form.useBy}
              onChange={update('useBy')}
              required
              hasError={!!errors.useBy}
            />
            {errors.useBy && (
              <Text className="text-danger text-xs -mt-3 mb-3">{errors.useBy}</Text>
            )}
            {useByInPast && (
              <View className="bg-warn-pale border border-warn rounded-xl px-4 py-2 mb-4">
                <Text className="text-warn text-sm">
                  ⚠️ This date is in the past — item may already be expired.
                </Text>
              </View>
            )}
          </>
        ) : (
          <DatePickerField
            label="Best Before (optional)"
            value={form.bestBefore}
            onChange={update('bestBefore')}
            clearable
          />
        )}

        {/* Notes */}
        <Text className="text-sm font-medium text-gray-600 mb-2">Notes (optional)</Text>
        <TextInput
          className="border border-surface-border rounded-xl px-4 py-3 text-base"
          placeholder="e.g. Marinated, gluten-free…"
          value={form.notes}
          onChangeText={update('notes')}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 80 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
