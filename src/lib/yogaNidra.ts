// Guided Yoga Nidra (founder, 22 Oct 2026: "recommend a Yoga Nidra session and take them to a guided session").
// Our own script, written for Happy Orange, following the classic stages of yoga nidra: settling, sankalpa
// (resolve), rotation of awareness through the body, breath counting, opposite feelings, images, sankalpa again,
// and an ending. At bedtime the ending lets the person drift into sleep; in the day it brings them gently back.
// About 15 minutes. Each step is spoken, then followed by a silence of `pause` seconds.

export interface NidraStep { en: string; hi: string; pause: number; stage: Stage }
export type Stage = 'settle' | 'resolve' | 'body' | 'breath' | 'feel' | 'images' | 'end';

const s = (stage: Stage, pause: number, en: string, hi: string): NidraStep => ({ stage, pause, en, hi });

// Body parts named one after another, a few seconds each.
const parts = (list: [string, string][], pause = 2): NidraStep[] => list.map(([en, hi]) => s('body', pause, en, hi));

const HAND_AND_LEG: [string, string][] = [
  ['The thumb.', 'अँगूठा।'], ['Second finger.', 'दूसरी उँगली।'], ['Third finger.', 'तीसरी उँगली।'], ['Fourth finger.', 'चौथी उँगली।'],
  ['Little finger.', 'छोटी उँगली।'], ['The palm.', 'हथेली।'], ['Back of the hand.', 'हाथ का पिछला भाग।'], ['The wrist.', 'कलाई।'],
  ['The forearm.', 'निचली बाँह।'], ['The elbow.', 'कोहनी।'], ['Upper arm.', 'ऊपरी बाँह।'], ['The shoulder.', 'कंधा।'],
  ['The armpit.', 'बगल।'], ['Side of the waist.', 'कमर का बगल।'], ['The hip.', 'कूल्हा।'], ['The thigh.', 'जाँघ।'],
  ['The knee.', 'घुटना।'], ['The calf.', 'पिंडली।'], ['The ankle.', 'टखना।'], ['The heel.', 'एड़ी।'], ['Sole of the foot.', 'तलवा।'],
  ['Big toe.', 'पैर का अँगूठा।'], ['Second toe.', 'दूसरी उँगली।'], ['Third toe.', 'तीसरी उँगली।'], ['Fourth toe.', 'चौथी उँगली।'], ['Little toe.', 'छोटी उँगली।'],
];

const BACK_AND_FRONT: [string, string][] = [
  ['The right shoulder blade.', 'दाहिना कंधे का पिछला भाग।'], ['The left shoulder blade.', 'बायाँ कंधे का पिछला भाग।'],
  ['The whole spine.', 'पूरी रीढ़।'], ['The whole back.', 'पूरी पीठ।'],
  ['The top of the head.', 'सिर का ऊपरी भाग।'], ['The forehead.', 'माथा।'], ['The right eyebrow.', 'दाहिनी भौंह।'], ['The left eyebrow.', 'बाईं भौंह।'],
  ['The space between the eyebrows.', 'दोनों भौंहों के बीच का स्थान।'], ['The right eye.', 'दाहिनी आँख।'], ['The left eye.', 'बाईं आँख।'],
  ['The right ear.', 'दाहिना कान।'], ['The left ear.', 'बायाँ कान।'], ['The right cheek.', 'दाहिना गाल।'], ['The left cheek.', 'बायाँ गाल।'],
  ['The nose.', 'नाक।'], ['The tip of the nose.', 'नाक का सिरा।'], ['The upper lip.', 'ऊपरी होंठ।'], ['The lower lip.', 'निचला होंठ।'],
  ['The chin.', 'ठोड़ी।'], ['The throat.', 'गला।'], ['The right side of the chest.', 'छाती का दाहिना भाग।'], ['The left side of the chest.', 'छाती का बायाँ भाग।'],
  ['The middle of the chest.', 'छाती का बीच।'], ['The navel.', 'नाभि।'], ['The whole abdomen.', 'पूरा पेट।'],
];

const WHOLE: [string, string][] = [
  ['The whole right leg.', 'पूरा दाहिना पैर।'], ['The whole left leg.', 'पूरा बायाँ पैर।'], ['Both legs together.', 'दोनों पैर एक साथ।'],
  ['The whole right arm.', 'पूरी दाहिनी बाँह।'], ['The whole left arm.', 'पूरी बाईं बाँह।'], ['Both arms together.', 'दोनों बाँहें एक साथ।'],
  ['The whole back.', 'पूरी पीठ।'], ['The whole front of the body.', 'शरीर का पूरा अगला भाग।'], ['The whole head.', 'पूरा सिर।'],
];

export function nidraScript(bedtime: boolean): NidraStep[] {
  return [
    s('settle', 6, 'Welcome to Yoga Nidra, the sleep of the yogis. Lie down on your back, arms a little away from the body, palms facing up.', 'योग निद्रा में आपका स्वागत है। पीठ के बल लेट जाइए, बाँहें शरीर से थोड़ी दूर, हथेलियाँ ऊपर की ओर।'),
    s('settle', 8, 'Let the feet fall apart. Close your eyes. Make any last movement, so that you are completely comfortable.', 'पैरों को ढीला छोड़ दीजिए। आँखें बंद कीजिए। आख़िरी बार हिल-डुलकर पूरी तरह आराम से लेट जाइए।'),
    s('settle', 6, 'From now on, keep the body still. The body rests. The mind stays gently awake, simply listening to my voice.', 'अब से शरीर को स्थिर रखिए। शरीर आराम करेगा। मन धीरे से जागा रहेगा, बस मेरी आवाज़ सुनता रहेगा।'),
    s('settle', 10, 'Take a slow breath in, and a long breath out. Once more: breathe in, and let everything go.', 'धीरे से साँस अंदर लीजिए, और लंबी साँस बाहर छोड़िए। एक बार और: साँस अंदर, और सब कुछ छोड़ दीजिए।'),
    s('settle', 15, 'Become aware of sounds far away. Just notice them, one by one, without naming them.', 'दूर की आवाज़ों को महसूस कीजिए। बस एक-एक करके उन्हें सुनिए, नाम दिए बिना।'),
    s('settle', 12, 'Now the sounds close by, in this room.', 'अब पास की आवाज़ें, इसी कमरे की।'),
    s('settle', 12, 'Now feel the body lying here. Feel every place where it touches the bed.', 'अब यहाँ लेटे शरीर को महसूस कीजिए। हर उस जगह को जहाँ शरीर बिस्तर को छू रहा है।'),
    s('resolve', 20, 'Now make your resolve, your sankalpa. A short, positive sentence in your own words, such as: I am calm and healthy. Say it silently three times, with feeling.', 'अब अपना संकल्प लीजिए। अपने शब्दों में एक छोटा, सकारात्मक वाक्य, जैसे: मैं शांत और स्वस्थ हूँ। इसे मन ही मन तीन बार, पूरे भाव से दोहराइए।'),
    s('body', 4, 'Now we move awareness through the body. As I name each part, simply feel it, and move on with my voice.', 'अब हम ध्यान को शरीर के हर अंग पर ले चलेंगे। जैसे ही मैं किसी अंग का नाम लूँ, बस उसे महसूस कीजिए, और मेरी आवाज़ के साथ आगे बढ़िए।'),
    s('body', 3, 'The right side of the body. The right hand.', 'शरीर का दाहिना भाग। दाहिना हाथ।'),
    ...parts(HAND_AND_LEG),
    s('body', 3, 'Now the left side of the body. The left hand.', 'अब शरीर का बायाँ भाग। बायाँ हाथ।'),
    ...parts(HAND_AND_LEG),
    s('body', 3, 'Now the back, and the front of the body.', 'अब पीठ, और शरीर का अगला भाग।'),
    ...parts(BACK_AND_FRONT),
    ...parts(WHOLE, 3),
    s('body', 12, 'The whole body. The whole body together. The whole body.', 'पूरा शरीर। पूरा शरीर एक साथ। पूरा शरीर।'),
    s('breath', 12, 'Now become aware of the natural breath. Do not change it. Feel the belly rise as you breathe in, and fall as you breathe out.', 'अब अपनी स्वाभाविक साँस को महसूस कीजिए। उसे बदलिए मत। साँस अंदर आते समय पेट को उठते, और बाहर जाते समय गिरते महसूस कीजिए।'),
    s('breath', 75, 'Count the breaths backwards, from twenty-seven down to one. Breathing in, twenty-seven. Breathing out, twenty-seven. If you lose count, simply start again from twenty-seven.', 'साँसों को उल्टा गिनिए, सत्ताईस से एक तक। साँस अंदर, सत्ताईस। साँस बाहर, सत्ताईस। गिनती भूल जाएँ तो फिर से सत्ताईस से शुरू कीजिए।'),
    s('feel', 15, 'Leave the counting. Now feel heaviness. The whole body is heavy, sinking into the bed.', 'गिनती छोड़ दीजिए। अब भारीपन महसूस कीजिए। पूरा शरीर भारी है, बिस्तर में धँसता हुआ।'),
    s('feel', 15, 'Now feel lightness. The body is so light, as if it could float.', 'अब हल्कापन महसूस कीजिए। शरीर इतना हल्का है, मानो तैर सकता है।'),
    s('feel', 12, 'Feel warmth, as if lying in the gentle morning sun.', 'गर्माहट महसूस कीजिए, मानो सुबह की कोमल धूप में लेटे हों।'),
    s('feel', 12, 'Now feel coolness, as if a soft breeze passes over you.', 'अब ठंडक महसूस कीजिए, मानो हल्की हवा आपको छूकर जा रही हो।'),
    s('images', 4, 'Now, as I name a few images, let each one appear by itself, without effort.', 'अब मैं कुछ चित्रों के नाम लूँगा। हर चित्र को बिना कोशिश के अपने आप आने दीजिए।'),
    s('images', 6, 'A calm lake at dawn.', 'भोर में एक शांत झील।'),
    s('images', 6, 'A lamp, burning steadily.', 'एक दीपक, स्थिर जलता हुआ।'),
    s('images', 6, 'An orange tree, full of fruit.', 'संतरे का एक पेड़, फलों से लदा हुआ।'),
    s('images', 6, 'Stars in a clear night sky.', 'साफ़ रात के आकाश में तारे।'),
    s('images', 6, 'A temple bell, ringing softly.', 'मंदिर की घंटी, धीमे से बजती हुई।'),
    s('images', 6, 'Waves on a quiet beach.', 'शांत समुद्र तट पर लहरें।'),
    s('images', 8, 'Your own face, smiling and at peace.', 'आपका अपना चेहरा, मुस्कुराता और शांत।'),
    s('images', 20, 'Let the images go. Rest in the quiet space behind the closed eyes.', 'चित्रों को जाने दीजिए। बंद आँखों के पीछे के शांत स्थान में विश्राम कीजिए।'),
    s('resolve', 20, 'Remember your resolve. Repeat it three times, with full feeling. It is now planted deep within you.', 'अपना संकल्प याद कीजिए। उसे तीन बार, पूरे भाव से दोहराइए। अब वह आपके भीतर गहराई में बो दिया गया है।'),
    ...(bedtime ? [
      s('end', 5, 'Now let go of my voice. There is nothing more to do. Let the breath carry you, gently, into deep and restful sleep. Good night.', 'अब मेरी आवाज़ को भी छोड़ दीजिए। अब कुछ करना नहीं है। साँस को धीरे-धीरे आपको गहरी, आरामदायक नींद में ले जाने दीजिए। शुभ रात्रि।'),
    ] : [
      s('end', 8, 'Become aware of the breath again. Of the body lying here. Of the sounds around you.', 'फिर से साँस को महसूस कीजिए। यहाँ लेटे शरीर को। आसपास की आवाज़ों को।'),
      s('end', 6, 'Gently move the fingers and toes. When you are ready, stretch, turn to your right side, and slowly sit up. Yoga Nidra is complete.', 'धीरे से उँगलियाँ और पैरों की उँगलियाँ हिलाइए। जब तैयार हों, अंगड़ाई लीजिए, दाहिनी करवट लीजिए, और धीरे से उठकर बैठ जाइए। योग निद्रा पूरी हुई।'),
    ]),
  ];
}

/** Rough length in minutes: speaking at about 2.3 words a second, plus the silences. */
export function nidraMinutes(steps: NidraStep[]): number {
  const sec = steps.reduce((t, x) => t + x.pause + x.en.split(/\s+/).length / 2.3, 0);
  return Math.round(sec / 60);
}
