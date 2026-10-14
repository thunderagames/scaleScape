<?php
declare(strict_types=1);

function scalescape_connect(array $config): mysqli
{
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $db = new mysqli($config['host'], $config['user'], $config['password'], $config['database'], (int) ($config['port'] ?? 3306));
    $db->set_charset('utf8mb4');
    return $db;
}

function scalescape_rows(mysqli $db, string $sql): array
{
    return $db->query($sql)->fetch_all(MYSQLI_ASSOC);
}

function scalescape_group(array $rows, string $key): array
{
    $grouped = [];
    foreach ($rows as $row) {
        $grouped[$row[$key]][] = $row;
    }
    return $grouped;
}

function scalescape_names(mysqli $db, array $languages, string $table, string $id_column): array
{
    $names = [];
    foreach (scalescape_rows($db, "SELECT {$id_column} AS id, language_code, name FROM {$table}") as $row) {
        $names[$row['id']][$row['language_code']] = $row['name'];
    }
    return array_map(static fn (array $by_language): array => scalescape_localized($languages, $by_language), $names);
}

function scalescape_localized(array $languages, array $by_language): array
{
    $localized = [];
    foreach ($languages as $language) {
        $localized[$language] = $by_language[$language] ?? null;
    }
    return $localized;
}

function scalescape_named_entries(array $rows, array $names, array $languages): array
{
    return array_map(static fn (array $row): array => [
        'id' => $row['id'],
        'names' => $names[$row['id']] ?? scalescape_localized($languages, []),
    ], $rows);
}

function scalescape_build_formulas(mysqli $db, array $languages): array
{
    $notes = scalescape_group(scalescape_rows($db, 'SELECT formula_id, degree, semitone_offset, degree_label, interval_label FROM scale_formula_notes ORDER BY formula_id, note_index'), 'formula_id');
    $characteristic = scalescape_group(scalescape_rows($db, 'SELECT formula_id, degree FROM scale_formula_characteristic_degrees ORDER BY formula_id, degree_index'), 'formula_id');
    $roles = scalescape_group(scalescape_rows($db, 'SELECT formula_id, degree, role FROM scale_formula_degree_roles ORDER BY formula_id, degree, role_index'), 'formula_id');
    $translations = scalescape_group(scalescape_rows($db, 'SELECT formula_id, language_code, name, history_text, usage_text FROM scale_formula_translations'), 'formula_id');

    $formulas = [];
    foreach (scalescape_rows($db, 'SELECT id, category_id, name FROM scale_formulas ORDER BY sort_order') as $row) {
        $id = $row['id'];
        $formula_notes = $notes[$id] ?? [];
        $formula = [
            'id' => $id,
            'name' => $row['name'],
            'category' => $row['category_id'],
            'degrees' => array_map(static fn (array $note): int => (int) $note['degree'], $formula_notes),
            'semitone_offsets' => array_map(static fn (array $note): int => (int) $note['semitone_offset'], $formula_notes),
        ];
        $degree_labels = array_column($formula_notes, 'degree_label');
        if (array_filter($degree_labels, 'is_string')) {
            $formula['degree_formula'] = array_map('strval', $degree_labels);
        }
        $interval_labels = array_column($formula_notes, 'interval_label');
        if (array_filter($interval_labels, 'is_string')) {
            $formula['interval_formula'] = array_map('strval', $interval_labels);
        }
        $formula['characteristic_degrees'] = array_map(static fn (array $item): int => (int) $item['degree'], $characteristic[$id] ?? []);
        $degree_roles = [];
        foreach ($roles[$id] ?? [] as $role) {
            $degree_roles[(int) $role['degree']][] = $role['role'];
        }
        $formula['degree_roles'] = (object) $degree_roles;

        $names = [];
        $descriptions = [];
        foreach ($translations[$id] ?? [] as $translation) {
            $names[$translation['language_code']] = $translation['name'];
            if ($translation['history_text'] !== null && $translation['usage_text'] !== null) {
                $descriptions[$translation['language_code']] = ['history' => $translation['history_text'], 'usage' => $translation['usage_text']];
            }
        }
        $formula['names'] = scalescape_localized($languages, $names);
        $formula['descriptions'] = scalescape_localized($languages, $descriptions);
        $formulas[] = $formula;
    }
    return $formulas;
}

function scalescape_build_catalog(mysqli $db): array
{
    $languages = array_column(scalescape_rows($db, 'SELECT code FROM languages ORDER BY code'), 'code');

    $category_names = scalescape_names($db, $languages, 'scale_category_translations', 'category_id');
    $genre_names = scalescape_names($db, $languages, 'progression_genre_translations', 'genre_id');
    $progression_names = scalescape_names($db, $languages, 'progression_translations', 'progression_id');
    $comparison_names = scalescape_names($db, $languages, 'comparison_translations', 'comparison_id');
    $chords = scalescape_group(scalescape_rows($db, 'SELECT progression_id, degree FROM progression_chords ORDER BY progression_id, chord_index'), 'progression_id');

    return [
        'version' => 1,
        'scale_categories' => scalescape_named_entries(scalescape_rows($db, 'SELECT id FROM scale_categories ORDER BY sort_order'), $category_names, $languages),
        'scale_formulas' => scalescape_build_formulas($db, $languages),
        'progression_genres' => scalescape_named_entries(scalescape_rows($db, 'SELECT id FROM progression_genres ORDER BY sort_order'), $genre_names, $languages),
        'progressions' => array_map(static fn (array $row): array => [
            'id' => $row['id'],
            'genre' => $row['genre_id'],
            'degrees' => array_map(static fn (array $chord): int => (int) $chord['degree'], $chords[$row['id']] ?? []),
            'names' => $progression_names[$row['id']] ?? scalescape_localized($languages, []),
        ], scalescape_rows($db, 'SELECT id, genre_id FROM progressions ORDER BY sort_order')),
        'comparisons' => array_map(static fn (array $row): array => [
            'id' => $row['id'],
            'formula_a' => $row['formula_a_id'],
            'formula_b' => $row['formula_b_id'],
            'changed_degree' => (int) $row['changed_degree'],
            'names' => $comparison_names[$row['id']] ?? scalescape_localized($languages, []),
        ], scalescape_rows($db, 'SELECT id, formula_a_id, formula_b_id, changed_degree FROM comparisons ORDER BY sort_order')),
    ];
}
