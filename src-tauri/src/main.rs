// src-tauri/src/main.rs

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod gguf;
mod oauth;
mod oauth_backend;
mod streaming;

use commands::{
    scan_project,
    read_file,
    write_file,
    create_file,
    chat_with_ai,
    chat_with_specific_ai,
    chat_with_dynamic_ai,
    create_embedding_bge,
    test_project,
    open_terminal,
    execute_terminal_command,
    minimize_window,
    maximize_window,
    close_window,
    download_gguf_model,
    get_all_files,
    read_file_content,
};

use gguf::{
    GgufState,
    load_gguf_model,
    chat_with_gguf_model,
    chat_with_gguf_vision, // 🆕 Vision AI
    unload_gguf_model,
    get_gguf_model_status,
    get_gpu_memory_info,
    read_gguf_metadata,
    check_cuda_support,
};

use oauth::oauth_authenticate;
use oauth_backend::{exchange_oauth_token, refresh_oauth_token};
use streaming::{chat_with_streaming, chat_with_http_streaming};

use std::sync::{Arc, Mutex};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    
    // 🎯 CUDA Kernel Cache - Prevent recompilation
    #[cfg(feature = "cuda")]
    {
        std::env::set_var("CUDA_CACHE_DISABLE", "0"); // Enable cache
        std::env::set_var("CUDA_CACHE_MAXSIZE", "4294967296"); // 4GB cache
        std::env::set_var("CUDA_FORCE_PTX_JIT", "0"); // Disable JIT compilation
        log::info!("🎮 CUDA cache enabled - kernels will be cached");
    }
    
    // GGUF state oluştur
    let gguf_state = Arc::new(Mutex::new(GgufState::default()));
    
    tauri::Builder::default()
        .manage(gguf_state.clone())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_project,
            read_file,
            write_file,
            create_file,
            chat_with_ai,
            chat_with_specific_ai,
            chat_with_dynamic_ai,
            create_embedding_bge,
            test_project,
            open_terminal,
            execute_terminal_command,
            minimize_window,
            maximize_window,
            close_window,
            commands::get_home_dir,
            commands::create_directory,
            commands::delete_file,
            commands::rename_file,
            commands::move_file,
            commands::copy_file,
            commands::get_file_metadata,
            commands::get_file_size,
            commands::git_status,
            commands::git_add,
            commands::git_commit,
            commands::git_push,
            commands::git_pull,
            commands::execute_command,
            load_gguf_model,
            chat_with_gguf_model,
            chat_with_gguf_vision, // 🆕 Vision AI
            unload_gguf_model,
            get_gguf_model_status,
            get_gpu_memory_info,
            read_gguf_metadata,
            check_cuda_support,
            download_gguf_model,
            get_all_files,
            read_file_content,
            oauth_authenticate,
            exchange_oauth_token,
            refresh_oauth_token,
            chat_with_streaming,
            chat_with_http_streaming,
        ])
        .on_window_event(move |window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Uygulama kapanırken cleanup yap
                log::info!("🔴 Window closing - cleaning up GGUF model...");
                
                if let Ok(mut state) = gguf_state.lock() {
                    if state.model_path.is_some() {
                        log::info!("🧹 Unloading GGUF model...");
                        state.model_path = None;
                        state.n_ctx = 4096;
                        state.n_gpu_layers = 0;
                        log::info!("✅ GGUF model unloaded");
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Binary için main fonksiyonu
fn main() {
    run();
}
