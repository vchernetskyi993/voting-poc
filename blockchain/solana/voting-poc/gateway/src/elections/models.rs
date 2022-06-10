use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Election {
    pub start: i64,
    pub end: i64,
    pub title: String,
    pub description: String,
    pub candidates: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ElectionId {
    pub id: u128,
}

#[derive(Debug, Deserialize)]
pub struct ListOptions {}

#[derive(Debug, Serialize)]
pub struct Page<T> {
    page_number: u128,
    page_size: u8,
    values: Vec<T>,
    elements_count: u128,
    page_count: u128,
}
