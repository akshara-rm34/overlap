import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { searchCities } from '@/lib/cities';
import { colors, fonts, radius, space, type } from '@/lib/theme';

import { fieldStyles } from './TextField';

type Props = {
  value: string | null;
  onChange: (city: string | null) => void;
};

// Type to search the city list. A city only counts once it's picked from the list.
export function CityField({ value, onChange }: Props) {
  const [query, setQuery] = useState(value ?? '');
  const [focused, setFocused] = useState(false);
  const results = searchCities(query);
  const showList = focused && query !== value && query.trim().length > 0;

  function onType(text: string) {
    setQuery(text);
    if (value) onChange(null);
  }

  function pick(city: string) {
    setQuery(city);
    onChange(city);
    setFocused(false);
  }

  return (
    <View style={styles.wrap}>
      <Text style={[type.label, styles.label]}>City</Text>
      <View style={fieldStyles.box}>
        <Feather name="search" size={16} color={colors.faint} style={styles.icon} />
        <TextInput
          value={query}
          onChangeText={onType}
          onFocus={() => setFocused(true)}
          placeholder="Search for your city"
          placeholderTextColor={colors.faint}
          autoCorrect={false}
          autoCapitalize="words"
          style={styles.input}
        />
        {value && <Feather name="check" size={16} color={colors.green} />}
      </View>
      {showList && (
        <View style={styles.list}>
          {results.length === 0 ? (
            <Text style={[type.small, styles.empty]}>
              No cities match. Try a different spelling.
            </Text>
          ) : (
            results.map((city, i) => (
              <Pressable
                key={city}
                onPress={() => pick(city)}
                style={({ pressed }) => [
                  styles.item,
                  i < results.length - 1 && styles.itemBorder,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.itemText}>{city}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: { marginBottom: space.sm },
  icon: { marginRight: space.sm },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 12,
  },
  list: {
    marginTop: space.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    backgroundColor: colors.bg,
  },
  item: { paddingHorizontal: 16, paddingVertical: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  pressed: { backgroundColor: colors.card },
  itemText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  empty: { padding: space.md },
});
