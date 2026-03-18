import { Alert, Platform, ScrollView, Share, Switch, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Crown, LogOut, Share2, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActiveHousehold, useHouseholdMembers, useGenerateInviteCode, useHouseholds } from '@/hooks/useHousehold';
import { useNotificationPrefs, useToggleNotifications } from '@/hooks/useNotifications';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { HouseholdMember } from '@/services/households';

// 📘 React Native Note — Settings screen architecture
// Settings screens are naturally list-like. We use ScrollView (not FlatList)
// because the content is static — a fixed set of sections, not a dynamic
// list of unknown length. ScrollView renders everything at once, which is
// fine here since there are only ~20 items total.
//
// Each "section" is a white rounded card separated by 12px of surface-alt
// background. This is the standard iOS Settings visual language.

// ── Reusable row building blocks ─────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-6">
      {title}
    </Text>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="mx-4 bg-white rounded-2xl border border-surface-border overflow-hidden">
      {children}
    </View>
  );
}

function SettingsRow({
  label,
  value,
  onPress,
  right,
  destructive = false,
  showDivider = true,
}: {
  label:        string;
  value?:       string;
  onPress?:     () => void;
  right?:       React.ReactNode;
  destructive?: boolean;
  showDivider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center px-4 py-3.5 active:bg-surface-alt ${showDivider ? 'border-b border-surface-border' : ''}`}
    >
      <Text className={`flex-1 text-base ${destructive ? 'text-danger font-medium' : 'text-gray-800'}`}>
        {label}
      </Text>
      {value && <Text className="text-sm text-gray-400 mr-2">{value}</Text>}
      {right}
      {onPress && !right && <ChevronRight color="#CBD5E1" size={16} />}
    </Pressable>
  );
}

// ── Avatar with initials ──────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View className="w-16 h-16 rounded-full bg-brand items-center justify-center">
      <Text className="text-white text-2xl font-bold">{initials || '?'}</Text>
    </View>
  );
}

// ── Member row ────────────────────────────────────────────────────────────────

function MemberRow({ member, adminUserId, showDivider }: {
  member:       HouseholdMember;
  adminUserId:  string;
  showDivider:  boolean;
}) {
  const isAdmin   = member.userId === adminUserId;
  const isPending = !member.joined;

  return (
    <View className={`flex-row items-center px-4 py-3 ${showDivider ? 'border-b border-surface-border' : ''}`}>
      {/* Initials mini-avatar */}
      <View className="w-8 h-8 rounded-full bg-brand-light items-center justify-center mr-3">
        <Text className="text-white text-xs font-bold">
          {(member.name || member.email)[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>

      <View className="flex-1">
        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
          {member.name || member.email}
        </Text>
        {member.name ? (
          <Text className="text-xs text-gray-400">{member.email}</Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2">
        {isAdmin && (
          <View className="flex-row items-center bg-brand-pale rounded-full px-2 py-0.5">
            <Crown color="#1A3A5C" size={10} style={{ marginRight: 3 }} />
            <Text className="text-xs text-brand font-medium">Admin</Text>
          </View>
        )}
        {isPending && (
          <View className="bg-warn-pale rounded-full px-2 py-0.5">
            <Text className="text-xs text-warn font-medium">Pending</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user, logout }               = useAuthStore();
  const { activeHouseholdId, setActiveHousehold } = useAppStore();
  const { data: households = [] }      = useHouseholds();
  const activeHousehold                = useActiveHousehold();
  const { data: members = [], isLoading: membersLoading } =
    useHouseholdMembers(activeHousehold?.teamId);
  const generateInviteCode             = useGenerateInviteCode(activeHousehold?.$id ?? '');
  const { data: notifPrefs }           = useNotificationPrefs();
  const toggleNotifications            = useToggleNotifications();

  const isAdmin = !!user && !!activeHousehold && user.$id === activeHousehold.adminUserId;
  const multipleHouseholds = households.length > 1;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) logout();
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  function handleSwitchHousehold() {
    Alert.alert(
      'Switch Household',
      'Choose a household:',
      households
        .map((h) => ({
          text: h.name + (h.$id === activeHouseholdId ? ' ✓' : ''),
          onPress: () => setActiveHousehold(h.$id),
        }))
        .concat([{ text: 'Cancel', style: 'cancel' } as unknown as { text: string; onPress: () => void }]),
    );
  }

  function handleGenerateCode(multiUse: boolean) {
    generateInviteCode.mutate(
      { multiUse },
      {
        onSuccess: (code) =>
          Alert.alert(
            'Invite Code Generated',
            `Share this code with your household members:\n\n${code}\n\n${multiUse ? 'This code can be used multiple times.' : 'This code expires in 48 hours and can only be used once.'}`,
            [
              { text: 'Close', style: 'cancel' },
              {
                text: 'Share Code',
                onPress: () =>
                  Share.share({ message: `Join my household on FreezerFamily! Code: ${code}` }),
              },
            ],
          ),
        onError: (e) =>
          Alert.alert('Error', e instanceof Error ? e.message : 'Could not generate code.'),
      },
    );
  }

  function handleGenerateInvite() {
    // 📘 React Native Note — Alert with multiple options
    // Alert.alert accepts a buttons array of any length. We use it here to
    // give the admin a choice between single-use and multi-use invite codes
    // without needing a separate modal screen.
    Alert.alert(
      'Generate Invite Code',
      'Choose the code type:',
      [
        {
          text: 'Single-use (48h expiry)',
          onPress: () => handleGenerateCode(false),
        },
        {
          text: 'Multi-use (permanent)',
          onPress: () => handleGenerateCode(true),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }

  function handleShareExistingCode() {
    const code = activeHousehold?.inviteCode;
    if (!code) return;
    Share.share({ message: `Join my household on FreezerFamily! Code: ${code}` });
  }

  function handleToggleNotifications(value: boolean) {
    toggleNotifications.mutate(value, {
      onError: (e) =>
        Alert.alert('Error', e instanceof Error ? e.message : 'Could not update preference.'),
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      className="flex-1 bg-surface-alt"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}
    >
      <Text className="text-2xl font-bold text-brand px-4 mb-4">Settings</Text>

      {/* ── Profile ── */}
      <SettingsCard>
        <View className="flex-row items-center px-4 py-4 border-b border-surface-border">
          <Avatar name={user?.name ?? user?.email ?? ''} />
          <View className="ml-4 flex-1">
            <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
              {user?.name || 'No name set'}
            </Text>
            <Text className="text-sm text-gray-400" numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>
        <SettingsRow
          label="Sign Out"
          destructive
          showDivider={false}
          right={<LogOut color="#DC2626" size={16} />}
          onPress={handleSignOut}
        />
      </SettingsCard>

      {/* ── Household ── */}
      <SectionHeader title="Household" />
      <SettingsCard>
        <View className="px-4 py-3.5 border-b border-surface-border">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-gray-800 flex-1" numberOfLines={1}>
              {activeHousehold?.name ?? 'No household'}
            </Text>
            {isAdmin && (
              <View className="flex-row items-center bg-brand-pale rounded-full px-2 py-0.5 ml-2">
                <Crown color="#1A3A5C" size={11} style={{ marginRight: 3 }} />
                <Text className="text-xs text-brand font-medium">Admin</Text>
              </View>
            )}
          </View>
          {activeHousehold?.householdTimezone && (
            <Text className="text-xs text-gray-400 mt-0.5">{activeHousehold.householdTimezone}</Text>
          )}
        </View>

        {multipleHouseholds && (
          <SettingsRow
            label="Switch Household"
            showDivider={false}
            onPress={handleSwitchHousehold}
          />
        )}
      </SettingsCard>

      {/* ── Members ── */}
      <SectionHeader title="Members" />
      <SettingsCard>
        {membersLoading ? (
          <View className="py-6 items-center">
            <ActivityIndicator color="#1A3A5C" />
          </View>
        ) : members.length === 0 ? (
          <View className="px-4 py-4">
            <Text className="text-sm text-gray-400">No members found.</Text>
          </View>
        ) : (
          members.map((member, idx) => (
            <MemberRow
              key={member.membershipId}
              member={member}
              adminUserId={activeHousehold?.adminUserId ?? ''}
              showDivider={idx < members.length - 1}
            />
          ))
        )}
      </SettingsCard>

      {/* ── Admin Tools (invite code) — only shown to admin ── */}
      {isAdmin && (
        <>
          <SectionHeader title="Invite Code" />
          <SettingsCard>
            {/* Current code display */}
            <View className="px-4 py-3.5 border-b border-surface-border">
              {activeHousehold?.inviteCode ? (
                <>
                  <Text className="text-xs text-gray-400 mb-1">
                    {activeHousehold.inviteCodeMultiUse ? 'Multi-use code' : 'Single-use code'}
                    {activeHousehold.inviteExpiresAt && !activeHousehold.inviteCodeMultiUse
                      ? `  ·  expires ${new Date(activeHousehold.inviteExpiresAt).toLocaleDateString()}`
                      : ''}
                  </Text>
                  <Text className="text-2xl font-bold tracking-widest text-brand">
                    {activeHousehold.inviteCode}
                  </Text>
                </>
              ) : (
                <Text className="text-sm text-gray-400">No active invite code.</Text>
              )}
            </View>

            {/* Share existing code */}
            {activeHousehold?.inviteCode && (
              <SettingsRow
                label="Share Code"
                right={<Share2 color="#1A3A5C" size={16} />}
                onPress={handleShareExistingCode}
              />
            )}

            {/* Generate new code */}
            <SettingsRow
              label={generateInviteCode.isPending ? 'Generating…' : 'Generate New Code'}
              showDivider={false}
              onPress={generateInviteCode.isPending ? undefined : handleGenerateInvite}
            />
          </SettingsCard>
        </>
      )}

      {/* ── Notifications ── */}
      <SectionHeader title="Notifications" />
      <SettingsCard>
        <View className="flex-row items-center px-4 py-3.5">
          <Bell color="#1A3A5C" size={18} style={{ marginRight: 12 }} />
          <Text className="flex-1 text-base text-gray-800">Expiry alerts</Text>
          {/* 📘 React Native Note — Switch
            // Switch is React Native's native toggle component. It renders as
            // a UISwitch on iOS and a Material toggle on Android automatically.
            // Pass value (controlled) and onValueChange (callback).
            // trackColor sets colours for off/on states; thumbColor sets the handle. */}
          <Switch
            value={notifPrefs?.notificationsEnabled ?? true}
            onValueChange={handleToggleNotifications}
            disabled={toggleNotifications.isPending}
            trackColor={{ false: '#CBD5E1', true: '#1A3A5C' }}
            thumbColor="white"
          />
        </View>
      </SettingsCard>

      {/* ── App info ── */}
      <SectionHeader title="About" />
      <SettingsCard>
        <SettingsRow label="Version" value="1.0.0" showDivider={false} />
      </SettingsCard>
    </ScrollView>
  );
}
