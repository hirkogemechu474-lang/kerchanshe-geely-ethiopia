/**
 * Vehicle.specifications (JSON) has two shapes in the wild:
 *
 *  - LEGACY (every vehicle created before the Vehicle Sections rework):
 *    { engine, dimensions, features, safety, warranty }
 *  - CANONICAL (the "Vehicle Sections" shape — Performance/Safety/Technology/
 *    Interior/Exterior admin-editable panels):
 *    { performance, safety, technology, interior, exterior, warranty }
 *
 * `web/app/models/[id]/page.tsx` (the public site) only ever reads the legacy
 * `engine`/`dimensions`/`features` keys — it has not been updated to read the
 * canonical shape. So every save from the reworked editor DUAL-WRITES both
 * shapes into the same JSON blob: the canonical keys for the new admin UI,
 * and the legacy keys (derived from the same data) so the public page keeps
 * working unmodified. This is a temporary compatibility shim — once the
 * public site is updated to read the canonical shape directly, the legacy
 * keys can be dropped from the save payload. Not done here; out of scope.
 */

/** One "feature story" entry (alternating image+headline+paragraph section on the public model page), e.g. one exterior styling point or one interior detail — replaces generic hardcoded copy with real, admin-authored, per-vehicle content. */
export interface SpecHighlight {
  title: string;
  description: string;
  imageUrl: string;
}

export interface CanonicalSpecSections {
  performance: {
    type: string;
    displacement: string;
    power: string;
    torque: string;
    transmission: string;
    drivetrain: string;
    fuelType: string;
    fuelEconomy: string;
    /** EV-specific — also dual-written to legacy `engine.range`/`engine.batteryCapacity`/`engine.acceleration`, which
     *  `web/app/models/[id]/page.tsx` and `web/app/compare/page.tsx` already read; `web/app/electric/page.tsx` and
     *  `web/app/category/[slug]/page.tsx` were fixed to read the same fields instead of nonexistent paths they'd
     *  previously guessed at (a `battery.capacity` object, a flat top-level `specs.range`). */
    range: string;
    batteryCapacity: string;
    acceleration: string;
  };
  safety: {
    airbags: string;
    abs: string;
    esc: string;
    tpms: string;
    cameras: string;
    sensors: string;
    adas: string;
    /** Dedicated safety-engineering photos/videos (crash structure, ADAS demos, etc.) — shown on the public model page's Safety Engineering section. */
    images: string[];
    /** Real, per-vehicle safety engineering stories (title/description/photo) — e.g. crash-structure or ADAS feature call-outs. */
    highlights: SpecHighlight[];
  };
  technology: {
    infotainment: string;
    connectivity: string;
    /** Dedicated technology photos/videos (powertrain/architecture CG, etc.) — shown on the public model page's Technology Deep Dive section. */
    images: string[];
    /** Real, per-vehicle technology stories (title/description/photo) — e.g. E-Drive, battery architecture, traction control. */
    highlights: SpecHighlight[];
  };
  interior: {
    climate: string;
    seats: string;
    seatingCapacity: string;
    cargoVolume: string;
    /** Dedicated interior photos/videos (multiple angles) — shown on the public model page's Interior Gallery section, distinct from the vehicle's general gallery. */
    images: string[];
    /** Real, per-vehicle interior feature stories (title/description/photo) — replaces the old hardcoded "Spacious Cabin/Premium Seating/..." copy on the public Comfort & Experience section. */
    highlights: SpecHighlight[];
  };
  exterior: {
    lighting: string;
    wheels: string;
    length: string;
    width: string;
    height: string;
    wheelbase: string;
    groundClearance: string;
    curbWeight: string;
    /** Dedicated exterior photos/videos (multiple angles) — shown on the public model page's Exteriors section, distinct from the vehicle's general gallery. */
    images: string[];
    /** Real, per-vehicle exterior feature stories (title/description/photo) — replaces generic hardcoded styling copy with an admin-authored, alternating image+text section on the public site. */
    highlights: SpecHighlight[];
  };
  warranty: {
    basic: string;
    powertrain: string;
    corrosion: string;
    roadside: string;
    maintenance: string;
  };
}

export const EMPTY_CANONICAL_SECTIONS: CanonicalSpecSections = {
  performance: { type: '', displacement: '', power: '', torque: '', transmission: '', drivetrain: '', fuelType: '', fuelEconomy: '', range: '', batteryCapacity: '', acceleration: '' },
  safety: { airbags: '', abs: '', esc: '', tpms: '', cameras: '', sensors: '', adas: '', images: [], highlights: [] },
  technology: { infotainment: '', connectivity: '', images: [], highlights: [] },
  interior: { climate: '', seats: '', seatingCapacity: '', cargoVolume: '', images: [], highlights: [] },
  exterior: { lighting: '', wheels: '', length: '', width: '', height: '', wheelbase: '', groundClearance: '', curbWeight: '', images: [], highlights: [] },
  warranty: { basic: '', powertrain: '', corrosion: '', roadside: '', maintenance: '' },
};

function normalizeHighlights(raw: any): SpecHighlight[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h) => h && typeof h === 'object')
    .map((h) => ({
      title: typeof h.title === 'string' ? h.title : '',
      description: typeof h.description === 'string' ? h.description : '',
      imageUrl: typeof h.imageUrl === 'string' ? h.imageUrl : '',
    }));
}

/** Converts a raw `Vehicle.specifications` JSON value (legacy or canonical shape, or a mix) into the canonical shape. */
export function normalizeToSections(raw: any): CanonicalSpecSections {
  const r = raw && typeof raw === 'object' ? raw : {};
  const legacyEngine = r.engine || {};
  const legacyDimensions = r.dimensions || {};
  const legacyFeatures = r.features || {};

  return {
    performance: {
      ...EMPTY_CANONICAL_SECTIONS.performance,
      ...legacyEngine,
      ...(r.performance || {}),
    },
    safety: {
      ...EMPTY_CANONICAL_SECTIONS.safety,
      ...(r.safety || {}),
      images: Array.isArray(r.safety?.images) ? r.safety.images : [],
      highlights: normalizeHighlights(r.safety?.highlights),
    },
    technology: {
      infotainment: r.technology?.infotainment ?? legacyFeatures.infotainment ?? '',
      connectivity: r.technology?.connectivity ?? legacyFeatures.connectivity ?? '',
      images: Array.isArray(r.technology?.images) ? r.technology.images : [],
      highlights: normalizeHighlights(r.technology?.highlights),
    },
    interior: {
      climate: r.interior?.climate ?? legacyFeatures.climate ?? '',
      seats: r.interior?.seats ?? legacyFeatures.seats ?? '',
      seatingCapacity: r.interior?.seatingCapacity ?? legacyDimensions.seatingCapacity ?? '',
      cargoVolume: r.interior?.cargoVolume ?? legacyDimensions.cargoVolume ?? '',
      images: Array.isArray(r.interior?.images) ? r.interior.images : [],
      highlights: normalizeHighlights(r.interior?.highlights),
    },
    exterior: {
      lighting: r.exterior?.lighting ?? legacyFeatures.lighting ?? '',
      wheels: r.exterior?.wheels ?? legacyFeatures.wheels ?? '',
      length: r.exterior?.length ?? legacyDimensions.length ?? '',
      width: r.exterior?.width ?? legacyDimensions.width ?? '',
      height: r.exterior?.height ?? legacyDimensions.height ?? '',
      wheelbase: r.exterior?.wheelbase ?? legacyDimensions.wheelbase ?? '',
      groundClearance: r.exterior?.groundClearance ?? legacyDimensions.groundClearance ?? '',
      curbWeight: r.exterior?.curbWeight ?? legacyDimensions.curbWeight ?? '',
      images: Array.isArray(r.exterior?.images) ? r.exterior.images : [],
      highlights: normalizeHighlights(r.exterior?.highlights),
    },
    warranty: {
      ...EMPTY_CANONICAL_SECTIONS.warranty,
      ...(r.warranty || {}),
    },
  };
}

/** Derives the legacy engine/dimensions/features shape from the canonical sections, for the dual-write. */
export function denormalizeToLegacy(sections: CanonicalSpecSections) {
  return {
    engine: { ...sections.performance },
    dimensions: {
      length: sections.exterior.length,
      width: sections.exterior.width,
      height: sections.exterior.height,
      wheelbase: sections.exterior.wheelbase,
      groundClearance: sections.exterior.groundClearance,
      curbWeight: sections.exterior.curbWeight,
      seatingCapacity: sections.interior.seatingCapacity,
      cargoVolume: sections.interior.cargoVolume,
    },
    features: {
      infotainment: sections.technology.infotainment,
      connectivity: sections.technology.connectivity,
      climate: sections.interior.climate,
      seats: sections.interior.seats,
      lighting: sections.exterior.lighting,
      wheels: sections.exterior.wheels,
    },
    safety: { ...sections.safety },
    warranty: { ...sections.warranty },
  };
}

/** Builds the full `Vehicle.specifications` JSON payload to save: canonical keys + dual-written legacy keys. */
export function toSpecificationsPayload(sections: CanonicalSpecSections) {
  return {
    ...denormalizeToLegacy(sections),
    performance: sections.performance,
    safety: sections.safety,
    technology: sections.technology,
    interior: sections.interior,
    exterior: sections.exterior,
    warranty: sections.warranty,
  };
}
