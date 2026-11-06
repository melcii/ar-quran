// The content model. Stories, scenes and their sources live as JSON under
// content/; the Quran text lives separately as read-only, versioned data under
// content/quran/ and is only ever referenced from stories by surah and ayah.

/** A reference to one ayah or a range of ayahs in one surah, e.g. "37:139-148". */
export type AyahRef = string;

export type ParsedRef = { surah: number; from: number; to: number };

/** draft → in-review → approved. Only "approved" stories may be published. */
export type EditorialReviewStatus = 'draft' | 'in-review' | 'changes-requested' | 'approved';

/** "prototype" content is shown with a visible notice that it is unreviewed. */
export type PublicationStatus = 'planned' | 'prototype' | 'published' | 'withdrawn';

export type Story = {
  id: string;
  slug: string;
  title: string;
  /** Short, plain introduction shown before the story. Explanation, not scripture. */
  description: string;
  figure: string;
  recommended_age: { min: number; max: number };
  estimated_duration_minutes: number;
  /** Key of an illustration in src/illustrations. */
  cover_art: string;
  category_ids: string[];
  /** The Quranic passages the story is built on, in reading order. */
  quran_references: AyahRef[];
  publication_status: PublicationStatus;
  editorial_review_status: EditorialReviewStatus;
  learning_objectives: string[];
  scenes: StoryScene[];
  reflection?: Reflection;
  activity?: OrderingActivity;
};

export type SceneKind = 'scene' | 'verses' | 'reflect';

export type StoryScene = {
  id: string;
  story_id: string;
  scene_number: number;
  kind: SceneKind;
  title: string;
  illustration_asset: string;
  /** Accessibility description of the illustration. */
  illustration_alt: string;
  /** Child-friendly explanation. Always shown labeled as an explanation. */
  educational_narration: string;
  /** Recorded narration file, or null when none has been recorded yet. */
  audio_asset: string | null;
  linked_ayah_references: AyahRef[];
  /** Ayahs shown in full inside the scene's reading panel, if any. */
  featured_ayah_references?: AyahRef[];
  interactive_elements: InteractiveElement[];
  /** What in this scene is artistic interpretation rather than stated fact. */
  source_notes: string;
};

export type InteractiveElement = {
  id: string;
  scene_id: string;
  object_name: string;
  /** Hotspot position as fractions of the illustration's width and height. */
  position: { x: number; y: number; radius: number };
  /** Key of an animation the illustration knows how to play. */
  animation_asset: string | null;
  explanatory_text: string;
  /** The ayah(s) the text relies on, or a SourceReference id. */
  supporting_source: AyahRef | string;
};

export type Reflection = {
  question: string;
  prompts: string[];
};

export type OrderingActivity = {
  instructions: string;
  /** Events in the correct order; the app shuffles them. */
  events: { id: string; text: string; reference: AyahRef }[];
};

export type SourceType = 'quran' | 'translation' | 'tafsir' | 'hadith' | 'history' | 'editorial';

export type SourceReference = {
  id: string;
  story_id: string;
  source_type: SourceType;
  source_reference: string;
  supporting_claim: string;
  reviewer_status: 'unreviewed' | 'approved' | 'rejected';
};

export type Reviewer = {
  name: string;
  qualification: string;
  decision: 'approved' | 'changes-requested';
  date: string;
  notes?: string;
};

export type Revision = { date: string; author: string; summary: string };

/** The documented editorial record every story needs before publication. */
export type EditorialRecord = {
  story_id: string;
  title: string;
  quran_references: AyahRef[];
  translation_id: string;
  children_explanation_summary: string;
  stated_in_quran: { detail: string; reference: AyahRef }[];
  not_specified_or_inferred: { detail: string; how_the_app_handles_it: string }[];
  supplementary_sources: SourceReference[];
  reviewers: Reviewer[];
  revision_history: Revision[];
};

export type Category = {
  id: string;
  title: string;
  kind: 'theme' | 'collection';
  description: string;
};

/** A story topic that has not been researched or written yet. */
export type PlannedStory = {
  id: string;
  title: string;
  figure: string;
  primary_surahs: number[];
  research_note: string;
};

export type Surah = {
  number: number;
  nameArabic: string;
  nameTransliterated: string;
  nameMeaning: string;
  revelation: 'Meccan' | 'Medinan';
  ayahCount: number;
};

export type QuranVerse = Readonly<{
  surah_number: number;
  surah_name: string;
  ayah_number: number;
  arabic_text: string;
  translation_text: string | null;
  translation_source: string;
  text_source: string;
  text_version: string;
}>;
