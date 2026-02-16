// src-tauri/src/lib.rs

// This is the library entry point for Tauri 2.x
// The main.rs file will call run() from here

mod commands;
pub mod gguf;
mod oauth;
mod oauth_backend;
mod streaming;

pub mod main_module {
    pub use crate::commands::*;
    pub use crate::oauth::*;
    pub use crate::oauth_backend::*;
}
