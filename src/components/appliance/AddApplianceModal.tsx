import { useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Minus, Plus, Snowflake, Thermometer } from 'lucide-react-native';

import { useCreateAppliance } from '@/hooks/useAppliances';
import type { ApplianceType } from '@/types';

// 📘 React Native Note — Dynamic form rows with useState array
// Each "Add compartment" press appends a new object to an array in state.
// The array is the source of truth; the FlatList/map renders one TextInput
// per element. Removing a row calls filter() to produce a new array —
// React re-renders only the affected rows. This is the standard React
// pattern for variable-length form fields.

interface CompartmentDraft {
  key: string;   // Unique key for React list rendering — never use array index
  label: string;
}

interface Props {
  visible: boolean;
  teamId:  string;
  onClose: () => void;
}

let keyCounter = 0;
function newKey() { return `c-${++keyCounter}`; }

const DEFAULT_COMPARTMENTS: Record<ApplianceType, string[]> = {
  freezer: ['Top Drawer', 'Middle Drawer', 'Bottom Drawer'],
  fridge:  ['Top Shelf', 'Middle Shelf', 'Bottom Shelf', 'Crisper'],
};

export function AddApplianceModal({ visible, teamId, onClose }: Props) {
  const createAppliance = useCreateAppliance();

  const [name, setName]         = useState('');
  const [type, setType]         = useState<ApplianceType>('freezer');
  const [compartments, setCompartments] = useState<CompartmentDraft[]>(() =>
    DEFAULT_COMPARTMENTS.freezer.map((label) => ({ key: newKey(), label })),
  );
  const [error, setError] = useState<string | null>(null);

  function switchType(t: ApplianceType) {
    setType(t);
    setCompartments(DEFAULT_COMPARTMENTS[t].map((label) => ({ key: newKey(), label })));
  }

  function addCompartment() {
    setCompartments((prev) => [...prev, { key: newKey(), label: '' }]);
  }

  function removeCompartment(key: string) {
    if (compartments.length <= 1) return; // keep at least one
    setCompartments((prev) => prev.filter((c) => c.key !== key));
  }

  function updateLabel(key: string, label: string) {
    setCompartments((prev) =>
      prev.map((c) => (c.key === key ? { ...c, label } : c)),
    );
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Please enter an appliance name.'); return; }
    const emptyLabel = compartments.some((c) => !c.label.trim());
    if (emptyLabel) { setError('Please label all compartments.'); return; }

    setError(null);
    try {
      await createAppliance.mutateAsync({
        teamId,
        input: {
          name: trimmedName,
          type,
          compartments: compartments.map((c, i) => ({ label: c.label.trim(), order: i })),
        },
      });
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save appliance. Please try again.');
    }
  }

  function handleClose() {
    setName('');
    setType('freezer');
    setCompartments(DEFAULT_COMPARTMENTS.freezer.map((label) => ({ key: newKey(), label })));
    setError(null);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-surface-border">
          <Pressable onPress={handleClose}>
            <Text className="text-gray-500 text-base">Cancel</Text>
          </Pressable>
          <Text className="font-bold text-lg text-brand">Add Appliance</Text>
          <Pressable onPress={handleSave} disabled={createAppliance.isPending}>
            {createAppliance.isPending
              ? <ActivityIndicator color="#1A3A5C" size="small" />
              : <Text className="text-brand-light font-semibold text-base">Save</Text>
            }
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
          {/* Name */}
          <Text className="text-sm font-medium text-gray-600 mt-5 mb-2">Appliance Name</Text>
          <TextInput
            className="border border-surface-border rounded-xl px-4 py-3 text-base"
            placeholder="e.g. Garage Freezer"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          {/* Type toggle */}
          <Text className="text-sm font-medium text-gray-600 mt-5 mb-2">Type</Text>
          <View className="flex-row gap-3">
            {(['freezer', 'fridge'] as ApplianceType[]).map((t) => (
              <Pressable
                key={t}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border-2 ${
                  type === t
                    ? 'border-brand bg-brand'
                    : 'border-surface-border bg-white'
                }`}
                onPress={() => switchType(t)}
              >
                {t === 'freezer'
                  ? <Snowflake color={type === t ? '#fff' : '#64748B'} size={16} />
                  : <Thermometer color={type === t ? '#fff' : '#64748B'} size={16} />
                }
                <Text className={`ml-2 font-semibold capitalize ${type === t ? 'text-white' : 'text-gray-600'}`}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Compartments builder */}
          <View className="flex-row items-center justify-between mt-5 mb-2">
            <Text className="text-sm font-medium text-gray-600">Compartments</Text>
            <Pressable
              className="flex-row items-center bg-brand-pale px-3 py-1.5 rounded-lg"
              onPress={addCompartment}
            >
              <Plus color="#1A3A5C" size={14} />
              <Text className="text-brand text-sm font-medium ml-1">Add</Text>
            </Pressable>
          </View>

          {/* Live preview list — also serves as the input */}
          {compartments.map((comp, idx) => (
            <View key={comp.key} className="flex-row items-center mb-2">
              <View className="w-7 h-7 rounded-lg bg-surface-alt items-center justify-center mr-3">
                <Text className="text-xs text-gray-500 font-medium">{idx + 1}</Text>
              </View>
              <TextInput
                className="flex-1 border border-surface-border rounded-xl px-4 py-2.5 text-base"
                placeholder={`Compartment ${idx + 1} label`}
                value={comp.label}
                onChangeText={(t) => updateLabel(comp.key, t)}
              />
              <Pressable
                className="ml-2 p-2"
                onPress={() => removeCompartment(comp.key)}
                disabled={compartments.length <= 1}
              >
                <Minus
                  color={compartments.length <= 1 ? '#CBD5E1' : '#EF4444'}
                  size={18}
                />
              </Pressable>
            </View>
          ))}

          {error ? (
            <Text className="text-danger text-sm mt-2 mb-2">{error}</Text>
          ) : null}

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
