// Library: the knowledge bundled inside the app — IFCT 2017, the Bhagavad Gita, the Tao Te Ching week and the exercise library.

import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Heading, Label, Note, Screen, Segmented, TextField, s } from '../components/ui';
import { TaoWeek } from '../components/TaoCard';
import { searchExercises } from '../lib/exercises';
import { chapters, versesOf } from '../lib/gita';
import { TAO_CORE, WEEK_REVIEW } from '../lib/tao';
import { IFCT_COLUMNS, foodByCode, formatAmount, nutrient, per100g, searchFoods } from '../lib/ifct';
import { PRACTICES } from '../lib/scoring';
import { colors } from '../theme';
import { tr } from '../lib/i18n';

type Section = 'food' | 'gita' | 'tao' | 'practices' | 'exercise';

export default function Library() {
  const [section, setSection] = useState<Section>('food');
  return (
    <Screen showDay={false} feedback="Library">
      <Segmented<Section> value={section} onChange={setSection}
        options={[{ label: tr('Food'), value: 'food' }, { label: tr('Gita'), value: 'gita' }, { label: tr('Tao'), value: 'tao' }, { label: tr('Practices'), value: 'practices' }, { label: tr('Exercises'), value: 'exercise' }]} />
      {section === 'food' ? <FoodLibrary /> : section === 'gita' ? <GitaLibrary /> : section === 'tao' ? <TaoLibrary /> : section === 'practices' ? <PracticesLibrary /> : <ExerciseLibrary />}
    </Screen>
  );
}

const MAIN = ['protcnt', 'fatce', 'choavldf', 'fibtg', 'ca', 'fe', 'zn', 'mg', 'k', 'na', 'vitc', 'folsum', 'thia', 'ribf', 'nia', 'cartb'];

function FoodLibrary() {
  const [query, setQuery] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const food = code ? foodByCode(code) : undefined;
  const label = (key: string) => IFCT_COLUMNS.find(c => c[0] === key)?.[1] ?? key;

  return (
    <Card>
      <Heading>{tr('Indian Food Composition Tables 2017')}</Heading>
      <TextField label={tr('Search foods')} value={query} onChangeText={t => { setQuery(t); setCode(null); }} placeholder={tr('e.g. bhindi, aavu paalu, ragi')} />
      {food ? (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.ink }}>{food.name}</Text>
          <Note>{food.group}{food.scientificName ? ` · ${food.scientificName}` : ''}</Note>
          {food.localNames ? <Note>{food.localNames}</Note> : null}
          <Label>{tr('Per 100 g')}</Label>
          <Text style={{ color: colors.ink }}>Energy: {Math.round(per100g(food).kcal)} kcal{per100g(food).energyCalculated ? ' (calculated)' : ''}</Text>
          {MAIN.map(k => nutrient(food, k) != null && (
            <View key={k} style={s.headingRow}><Text style={{ color: colors.ink }}>{label(k)}</Text><Text style={{ color: colors.muted }}>{formatAmount(nutrient(food, k))}</Text></View>
          ))}
          <Pressable onPress={() => setCode(null)}><Text style={{ color: colors.accent, fontWeight: '600' }}>{tr('Back to results')}</Text></Pressable>
        </View>
      ) : searchFoods(query, 25).map(f => (
        <Pressable key={f.code} onPress={() => setCode(f.code)} style={{ paddingVertical: 6 }}>
          <Text style={{ fontWeight: '600', color: colors.ink }}>{f.name}</Text>
          <Text style={s.note}>{f.group} · {Math.round(per100g(f).kcal)} kcal per 100 g</Text>
        </Pressable>
      ))}
      <Note>{tr('Source: ICMR–National Institute of Nutrition, Hyderabad.')}</Note>
    </Card>
  );
}

function GitaLibrary() {
  const [ch, setCh] = useState(1);
  const c = chapters[ch - 1];
  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {chapters.map(x => (
            <Pressable key={x.n} onPress={() => setCh(x.n)}
              style={{ width: 38, paddingVertical: 6, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: x.n === ch ? colors.soul : colors.line, backgroundColor: x.n === ch ? colors.soul + '18' : colors.surface }}>
              <Text style={{ color: colors.ink }}>{x.n}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ fontSize: 22, color: colors.ink }}>{c.name}</Text>
        <Note>{c.translit} · {c.meaning} · {tr('{n} verses', { n: c.count })}</Note>
        <Text style={{ color: colors.ink, lineHeight: 21 }}>{c.summary}</Text>
      </Card>
      <Card>
        {versesOf(ch).map(v => (
          <View key={v.id} style={{ gap: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <Label>{v.chapter}.{v.verse}</Label>
            <Text style={{ fontSize: 18, lineHeight: 28, color: colors.ink }}>{v.sanskrit}</Text>
            <Text style={{ fontStyle: 'italic', color: colors.muted }}>{v.transliteration}</Text>
          </View>
        ))}
      </Card>
    </>
  );
}

function TaoLibrary() {
  return (
    <>
      <Card>
        <Heading>{tr('Tao Te Ching: a week of practice')}</Heading>
        <Text style={{ fontSize: 17, color: colors.ink, fontWeight: '600', lineHeight: 24 }}>{tr(TAO_CORE.summary)}</Text>
        <Text style={{ color: colors.ink, lineHeight: 21 }}>{tr(TAO_CORE.returning)}</Text>
        <Text style={{ color: colors.ink, lineHeight: 21 }}>{tr(TAO_CORE.gentleness)}</Text>
        {TAO_CORE.reflection.map((p, i) => <Text key={i} style={{ color: colors.ink, lineHeight: 21 }}>{tr(p)}</Text>)}
      </Card>
      <Card>
        <Heading>{tr('The week')}</Heading>
        <Note>{tr('Each day\'s practice appears on the Mind tab. Doing it adds 10 points to Mind.')}</Note>
        <TaoWeek />
      </Card>
      <Card>
        <Heading>{tr('At the end of the week')}</Heading>
        <Text style={{ color: colors.ink, lineHeight: 21 }}>{tr(WEEK_REVIEW.intro)}</Text>
        {WEEK_REVIEW.cracks.map((c, i) => <Text key={i} style={{ color: colors.ink }}>• {tr(c)}</Text>)}
      </Card>
      <Card>
        <Heading>{tr('When a door will not open')}</Heading>
        <Text style={{ color: colors.ink, lineHeight: 21 }}>{tr(TAO_CORE.stuckIntro)}</Text>
        {TAO_CORE.stuck.map((c, i) => <Text key={i} style={{ color: colors.ink }}>{i + 1}. {tr(c)}</Text>)}
        <Note>{tr('A practice guide inspired by the Tao Te Ching, written for Happy Orange. Not a translation of the text.')}</Note>
      </Card>
    </>
  );
}

function ExerciseLibrary() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card>
      <Heading>{tr('Exercise library')}</Heading>
      <TextField label={tr('Search')} value={query} onChangeText={setQuery} placeholder={tr('e.g. squat, plank, hamstrings')} />
      {searchExercises(query).map(e => (
        <Pressable key={e.name} onPress={() => setOpen(open === e.name ? null : e.name)} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 4 }}>
          <Text style={{ fontWeight: '600', color: colors.ink }}>{e.name}</Text>
          <Text style={s.note}>{[e.category, e.level, e.equipment].filter(Boolean).join(' · ')}</Text>
          {open === e.name && (
            <View style={{ gap: 4, paddingTop: 4 }}>
              <Text style={{ color: colors.muted }}>Works: {e.primaryMuscles.join(', ')}</Text>
              {e.instructions.map((step, i) => <Text key={i} style={{ color: colors.ink }}>{i + 1}. {step}</Text>)}
            </View>
          )}
        </Pressable>
      ))}
    </Card>
  );
}

/** The eight practices of inner life. Taken off the Soul tab on 20 Oct 2026 and kept here for the future, when
 *  Happy Orange can understand a person's day on these eight areas without a checklist (founder). */
function PracticesLibrary() {
  return (
    <Card>
      <Heading>{tr('The eight practices')}</Heading>
      <Note>{tr('Eight areas of inner life, led by truthfulness and fairness. Later, Happy Orange will understand them from your day, with no checklist.')}</Note>
      {PRACTICES.map(p => (
        <View key={p.id} style={{ gap: 2, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
          <Text style={{ fontWeight: '700', color: colors.ink }}>{p.name}{p.orangeBook ? <Text style={{ color: colors.insight, fontSize: 12 }}>  {tr('Orange Book')}</Text> : null}</Text>
          <Text style={{ color: colors.muted }}>{tr(p.meaning)}</Text>
        </View>
      ))}
    </Card>
  );
}
