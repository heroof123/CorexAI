// OAuth Backend - Secure token exchange
// Client secrets are stored server-side, never exposed to frontend

use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenRequest {
    pub code: String,
    pub provider: String,
    pub redirect_uri: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: Option<u64>,
    pub token_type: String,
}

#[tauri::command]
pub async fn exchange_oauth_token(
    code: String,
    provider: String,
    redirect_uri: String,
) -> Result<TokenResponse, String> {
    println!("🔐 Exchanging OAuth token for provider: {}", provider);
    
    // Get client credentials from environment (NEVER from frontend!)
    let (client_id, client_secret, token_url) = match provider.as_str() {
        "github" => (
            env::var("GITHUB_CLIENT_ID")
                .map_err(|_| "GITHUB_CLIENT_ID not set".to_string())?,
            env::var("GITHUB_CLIENT_SECRET")
                .map_err(|_| "GITHUB_CLIENT_SECRET not set".to_string())?,
            "https://github.com/login/oauth/access_token".to_string(),
        ),
        "microsoft" => (
            env::var("MICROSOFT_CLIENT_ID")
                .map_err(|_| "MICROSOFT_CLIENT_ID not set".to_string())?,
            env::var("MICROSOFT_CLIENT_SECRET")
                .map_err(|_| "MICROSOFT_CLIENT_SECRET not set".to_string())?,
            "https://login.microsoftonline.com/common/oauth2/v2.0/token".to_string(),
        ),
        _ => return Err(format!("Unknown provider: {}", provider)),
    };
    
    // Exchange code for token
    let client = reqwest::Client::new();
    
    let params = [
        ("client_id", client_id.as_str()),
        ("client_secret", client_secret.as_str()),
        ("code", code.as_str()),
        ("redirect_uri", redirect_uri.as_str()),
        ("grant_type", "authorization_code"),
    ];
    
    let response = client
        .post(&token_url)
        .header("Accept", "application/json")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token exchange request failed: {}", e))?;
    
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed: {}", error_text));
    }
    
    let token_data: TokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;
    
    println!("✅ Token exchange successful");
    
    Ok(token_data)
}

#[tauri::command]
pub async fn refresh_oauth_token(
    refresh_token: String,
    provider: String,
) -> Result<TokenResponse, String> {
    println!("🔄 Refreshing OAuth token for provider: {}", provider);
    
    let (client_id, client_secret, token_url) = match provider.as_str() {
        "github" => {
            // GitHub doesn't support refresh tokens
            return Err("GitHub does not support token refresh".to_string());
        }
        "microsoft" => (
            env::var("MICROSOFT_CLIENT_ID")
                .map_err(|_| "MICROSOFT_CLIENT_ID not set".to_string())?,
            env::var("MICROSOFT_CLIENT_SECRET")
                .map_err(|_| "MICROSOFT_CLIENT_SECRET not set".to_string())?,
            "https://login.microsoftonline.com/common/oauth2/v2.0/token".to_string(),
        ),
        _ => return Err(format!("Unknown provider: {}", provider)),
    };
    
    let client = reqwest::Client::new();
    
    let params = [
        ("client_id", client_id.as_str()),
        ("client_secret", client_secret.as_str()),
        ("refresh_token", refresh_token.as_str()),
        ("grant_type", "refresh_token"),
    ];
    
    let response = client
        .post(&token_url)
        .header("Accept", "application/json")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token refresh request failed: {}", e))?;
    
    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Token refresh failed: {}", error_text));
    }
    
    let token_data: TokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;
    
    println!("✅ Token refresh successful");
    
    Ok(token_data)
}
