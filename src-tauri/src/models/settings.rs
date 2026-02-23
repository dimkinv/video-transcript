use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub api_key: String,
    pub default_output_folder: Option<String>,
    pub preferred_languages: Vec<String>,
    pub chunk_duration_minutes: u32,
    pub max_retries: u8,
    pub source_language: String,
    pub target_language: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            default_output_folder: None,
            preferred_languages: Vec::new(),
            chunk_duration_minutes: 20,
            max_retries: 3,
            source_language: "en".to_string(),
            target_language: None,
        }
    }
}

impl AppSettings {
    pub fn validate(&self) -> Result<(), String> {
        if !(5..=60).contains(&self.chunk_duration_minutes) {
            return Err("Chunk duration must be between 5 and 60 minutes.".to_string());
        }

        if !(1..=10).contains(&self.max_retries) {
            return Err("Max retries must be between 1 and 10.".to_string());
        }

        if self.source_language.trim().is_empty() {
            return Err("Source language is required.".to_string());
        }

        Ok(())
    }
}
