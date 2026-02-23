use crate::models::language::Language;

#[tauri::command]
pub fn get_supported_languages() -> Vec<Language> {
    let mut languages = crate::models::language::supported_languages();
    languages.sort_by(|a, b| a.name.cmp(b.name));
    languages
}
