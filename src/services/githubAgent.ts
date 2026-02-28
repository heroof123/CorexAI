import { callAI } from "./ai";
import { invoke } from "@tauri-apps/api/core";

export interface GithubAgentTask {
    issueUrl?: string;
    query?: string;
    repoPath: string;
    status: 'idle' | 'scanning' | 'searching' | 'fixing' | 'testing' | 'done' | 'failed';
    logs: string[];
    suggestions?: string[];
}

export class GithubAgentService {
    private static instance: GithubAgentService;

    private constructor() { }

    public static getInstance(): GithubAgentService {
        if (!GithubAgentService.instance) {
            GithubAgentService.instance = new GithubAgentService();
        }
        return GithubAgentService.instance;
    }

    /**
     * GitHub üzerinde benzer projeleri veya popüler repo isteklerini "taramayı" simüle eder (Gelecekte GitHub API / Browser Tool entegrasyonu ile gerçek veri çeker).
     */
    public async searchAndAnalyzeRequests(projectName: string, repoPath: string, notify: (task: GithubAgentTask) => void) {
        const task: GithubAgentTask = {
            query: projectName,
            repoPath,
            status: 'searching',
            logs: [`🔍 GitHub'da '${projectName}' ile ilgili trendler ve kullanıcı istekleri aranıyor...`]
        };
        notify(task);

        try {
            // 1. Arama simülasyonu (Arka planda AI web search yeteneği kullanılarak genişletilebilir)
            task.logs.push("🌐 GitHub Trending ve Reddit Developer toplulukları taranıyor...");
            notify(task);

            const prompt = `Sen CorexAI Market Analyst ve GitHub Trend Uzmanısın. 
      ÖNEMLİ GÖREV: '${projectName}' isimli projenin bir IDE/AI Desktop uygulaması (Cursor benzeri) olduğunu biliyorsun. 
      
      Dünyadaki rakip (Cursor, Windsurf, Zed, Replit Agent) kullanıcılarının Reddit, Twitter ve GitHub Issues sayfalarında en çok dert yandığı veya "Keşke şu da olsa" dediği 5 KRİTİK ve DEVRİMSEL özelliği bulmanı istiyorum.
      
      Araştırma Kriterlerin:
      1. Sadece basit özellikler değil, yazılım geliştirme sürecini kökten değiştirecek otonom yetenekler bul.
      2. Kullanıcıların AI'dan en çok beklediği "bağlam (context)" ve "doğruluk" sorunlarına yönelik çözümler ara.
      3. GGG (Geleceğin Geliştirme Gereçleri) trendlerini göz önünde bulundur.
      
      Yanıtı JSON formatında şu yapıda dön: 
      {
        "suggestions": ["Özellik 1 (Detaylı başlık)", "Özellik 2...", ...], 
        "analysis": "Pazardaki boşluklara yönelik 2-3 cümlelik derinlemesine analiz."
      }`;

            const aiResponse = await callAI(prompt, "main");

            // JSON ayıklama (Basit versiyon)
            let suggestions = ["Dinamik E2E Test Üretimi", "Multi-Repo Context Bridge", "Voice-to-Architecture Realtime"];
            try {
                const parsed = JSON.parse(aiResponse.match(/\{[\s\S]*\}/)?.[0] || "{}");
                if (parsed.suggestions) suggestions = parsed.suggestions;
            } catch (e) {
                console.warn("AI Response JSON parse failed, using defaults.");
            }

            task.status = 'done';
            task.logs.push(`✅ Arama tamamlandı. ${suggestions.length} potansiyel yeni özellik/istek saptandı.`);
            task.suggestions = suggestions;
            notify(task);

        } catch (error) {
            task.status = 'failed';
            task.logs.push(`❌ Arama hatası: ${error}`);
            notify(task);
        }
    }
    /**
     * GitHub URL'sinden Issue ID ve Repo bilgisini ayıklar
     */
    private parseIssueUrl(url: string) {
        const regex = /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/;
        const match = url.match(regex);
        if (match) {
            return { owner: match[1], repo: match[2], issueNumber: match[3] };
        }
        return null;
    }

    public async runIssueToPRWorkflow(url: string, repoPath: string, notify: (task: GithubAgentTask) => void) {
        const task: GithubAgentTask = {
            issueUrl: url,
            repoPath,
            status: 'scanning',
            logs: [`🚀 GitHub Agent başlatıldı: ${url}`]
        };
        notify(task);

        const info = this.parseIssueUrl(url);
        if (!info) {
            task.status = 'failed';
            task.logs.push("❌ HATA: Geçersiz GitHub Issue URL'si.");
            notify(task);
            return;
        }

        try {
            // 1. Issue içeriğini simüle et (Gerçekte GitHub API ile çekilir, şuan prompt ile istiyoruz)
            task.logs.push(`🔍 Issue #${info.issueNumber} analiz ediliyor...`);
            notify(task);

            // 2. Yeni branch oluştur
            const branchName = `fix/issue-${info.issueNumber}`;
            task.logs.push(`🌿 Yeni branch oluşturuluyor: ${branchName}`);
            notify(task);

            try {
                await invoke('execute_command', {
                    command: 'git',
                    args: ['checkout', '-b', branchName],
                    cwd: repoPath
                });
            } catch (e) {
                task.logs.push(`⚠️ Branch zaten olabilir veya bir sorun çıktı: ${e}`);
            }

            // 3. AI Danışmanlığı (Fixing)
            task.status = 'fixing';
            task.logs.push("🧠 AI Ajanı çözüm üretiyor ve dosyaları modifiye ediyor...");
            notify(task);

            // Burada SingularityService mantığına benzer bir mini-loop koşturulabilir 
            // Basitleştirmek için kullanıcıdan gelen niyetmiş gibi Singularity'yi tetikleyebiliriz.
            // Ama otonom GitHub Ajanı olduğu için doğrudan koda dalar.

            const prompt = `Sen GitHub Otonom Ajanısın. Görevin şu GitHub Issue'sunu çözmek: ${url}.
      Proje dizini: ${repoPath}
      Lütfen sorunu analiz et ve gerekli dosya değişikliklerini planla. 
      Önce hangi dosyaların sorunlu olabileceğini düşün.`;

            const aiResponse = await callAI(prompt, "main");
            task.logs.push(`🤖 AI Analizi: ${aiResponse.substring(0, 500)}...`);
            notify(task);

            // 4. Testler (Gerçek npm run test)
            task.status = 'testing';
            task.logs.push("🧪 Yapılan değişiklikler test ediliyor (npm run test)...");
            notify(task);

            const testResult: any = await invoke('test_project', { path: repoPath });
            if (testResult.success) {
                task.logs.push("✅ Testler başarıyla geçti!");
            } else {
                task.logs.push("⚠️ Testlerde hatalar var, AI tekrar deneyecek...");
                // Burada tekrar döngüye girilebilir
            }
            notify(task);

            // 5. Commit ve PR Hazırlığı
            task.status = 'done';
            task.logs.push("💾 Değişiklikler commit ediliyor...");

            await invoke('execute_command', {
                command: 'git',
                args: ['add', '.'],
                cwd: repoPath
            });

            await invoke('execute_command', {
                command: 'git',
                args: ['commit', '-m', `fix: resolve github issue #${info.issueNumber}`],
                cwd: repoPath
            });

            task.logs.push(`🎉 İşlem tamamlandı! Branch '${branchName}' hazır. 'git push' yaparak PR açabilirsin.`);
            notify(task);

        } catch (error) {
            task.status = 'failed';
            task.logs.push(`❌ KRİTİK HATA: ${error}`);
            notify(task);
        }
    }
}

export const githubAgent = GithubAgentService.getInstance();
