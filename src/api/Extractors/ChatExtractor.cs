using System.Net.Http.Headers;
using System.Text.Json;
using CommitApi.Models.Extraction;

namespace CommitApi.Extractors;

/// <summary>
/// Scans Teams DMs and channel messages for action-intent signals
/// that indicate commitments ("I'll", "will do", "by Friday", etc.).
/// </summary>
public sealed class ChatExtractor : IChatExtractor
{
    private readonly ILogger<ChatExtractor> _logger;
    private readonly HttpClient _http;

    private const string GraphV1 = "https://graph.microsoft.com/v1.0";

    // Action-intent phrases that indicate a commitment
    private static readonly string[] ActionSignals =
    [
        "i'll", "i will", "will do", "will send", "will review", "will fix",
        "will submit", "will complete", "will share", "will update", "will provide",
        "will schedule", "will create", "will prepare", "will follow up", "will reach out",
        "by tomorrow", "by friday", "by eod", "by end of day",
        "by monday", "by next week", "by march", "by april", "by may", "by june",
        "by january", "by february", "by july", "by august", "by september",
        "by october", "by november", "by december",
        "by 1st", "by 2nd", "by 3rd", "by 4th", "by 5th", "by 6th", "by 7th",
        "by 8th", "by 9th", "by 10th", "by 15th", "by 20th", "by 25th", "by 30th",
        "i can", "let me", "i'll get", "on it", "taking this", "i own", "i'll own"
    ];

    public ChatExtractor(
        ILogger<ChatExtractor> logger,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _http   = httpClientFactory.CreateClient("graph");
    }

    /// <inheritdoc/>
    public async Task<IReadOnlyList<RawCommitment>> ExtractAsync(
        string bearerToken,
        int days = 3,
        CancellationToken ct = default)
    {
        var sinceOffset = DateTimeOffset.UtcNow.AddDays(-days);
        var commitments = new List<RawCommitment>();

        // Fetch the user's chats (DMs and group chats)
        var chatsUrl = $"{GraphV1}/me/chats";
        var chats    = await GetPagedAsync(chatsUrl, bearerToken, ct);

        foreach (var chat in chats)
        {
            var chatId   = chat.GetProperty("id").GetString() ?? "";
            var chatType = chat.TryGetProperty("chatType", out var ct2) ? ct2.GetString() : "unknown";
            var topic    = chat.TryGetProperty("topic", out var t) ? t.GetString() : null;

            // Only DMs and small group chats (not channels — handled separately)
            if (chatType != "oneOnOne" && chatType != "group") continue;

            var artifactName = !string.IsNullOrWhiteSpace(topic)
                ? topic : chatType == "oneOnOne" ? "Direct message" : "Group chat";

            // Graph does not support $filter on createdDateTime for chat messages — fetch
            // newest 50 and filter client-side by the since threshold.
            var messagesUrl = $"{GraphV1}/me/chats/{chatId}/messages?$top=50";

            var messages = await GetPagedAsync(messagesUrl, bearerToken, ct);

            foreach (var msg in messages)
            {
                // Filter by date client-side (Graph chat messages API doesn't support $filter on createdDateTime)
                if (msg.TryGetProperty("createdDateTime", out var cdt))
                {
                    if (DateTimeOffset.TryParse(cdt.GetString(), out var msgTime) && msgTime < sinceOffset)
                        continue;
                }

                var bodyContent = msg.TryGetProperty("body", out var body)
                    ? body.TryGetProperty("content", out var c) ? c.GetString() : null
                    : null;

                if (bodyContent is null || !HasActionSignal(bodyContent)) continue;

                var sender    = msg.TryGetProperty("from", out var from)
                    ? from.TryGetProperty("user", out var u) ? u : default
                    : default;
                var userId    = sender.ValueKind != JsonValueKind.Undefined
                    ? sender.TryGetProperty("id", out var uid) ? uid.GetString() : null
                    : null;
                var name      = sender.ValueKind != JsonValueKind.Undefined
                    ? sender.TryGetProperty("displayName", out var dn) ? dn.GetString() : "Unknown"
                    : "Unknown";
                var webUrl     = msg.TryGetProperty("webUrl", out var wu) ? wu.GetString() : "";
                var messageId  = msg.TryGetProperty("id", out var mid) ? mid.GetString() : null;

                // Strip HTML tags from body for context snippet
                var plainText = StripHtml(bodyContent);
                var context   = plainText.Length > 200 ? plainText[..200] : plainText;

                var sourceMeta = messageId is not null
                    ? System.Text.Json.JsonSerializer.Serialize(
                        new { chatId, messageId, chatType = "dm" })
                    : null;

                commitments.Add(new RawCommitment(
                    Title:             InferTitle(plainText),
                    OwnerUserId:       userId ?? "unknown",
                    OwnerDisplayName:  name ?? "Unknown",
                    SourceType:        CommitmentSourceType.Chat,
                    SourceUrl:         webUrl ?? "",
                    ExtractedAt:       DateTimeOffset.UtcNow,
                    DueAt:             InferDueDate(plainText),
                    Confidence:        0.70,  // Chat signals are heuristic; NLP pipeline will refine
                    WatcherUserIds:    [],
                    SourceContext:     context,
                    SourceMetadata:    sourceMeta,
                    ProjectContext:    null,          // DMs have no project context
                    ArtifactName:      artifactName));
            }
        }

        // ── Scan joined-team channel messages ─────────────────────────────────
        var teamsUrl = $"{GraphV1}/me/joinedTeams";
        var teams    = await GetPagedAsync(teamsUrl, bearerToken, ct);

        foreach (var team in teams)
        {
            var teamId      = team.GetProperty("id").GetString() ?? "";
            var teamName    = team.TryGetProperty("displayName", out var tdn) ? tdn.GetString() : null;

            var channelsUrl = $"{GraphV1}/teams/{teamId}/channels";
            var channels    = await GetPagedAsync(channelsUrl, bearerToken, ct);

            foreach (var channel in channels)
            {
                var channelId          = channel.GetProperty("id").GetString() ?? "";
                var channelDisplayName = channel.TryGetProperty("displayName", out var cdn) ? cdn.GetString() : null;

                // Graph does not support $filter on createdDateTime for channel messages either
                var channelMessagesUrl =
                    $"{GraphV1}/teams/{teamId}/channels/{channelId}/messages?$top=30";

                var channelMessages = await GetPagedAsync(channelMessagesUrl, bearerToken, ct);

                foreach (var msg in channelMessages)
                {
                    // Filter by date client-side
                    if (msg.TryGetProperty("createdDateTime", out var cdt2))
                    {
                        if (DateTimeOffset.TryParse(cdt2.GetString(), out var msgTime2) && msgTime2 < sinceOffset)
                            continue;
                    }

                    var bodyContent = msg.TryGetProperty("body", out var body)
                        ? body.TryGetProperty("content", out var c) ? c.GetString() : null
                        : null;

                    if (bodyContent is null || !HasActionSignal(bodyContent)) continue;

                    var sender = msg.TryGetProperty("from", out var from)
                        ? from.TryGetProperty("user", out var u) ? u : default
                        : default;
                    var userId = sender.ValueKind != JsonValueKind.Undefined
                        ? sender.TryGetProperty("id", out var uid) ? uid.GetString() : null
                        : null;
                    var name = sender.ValueKind != JsonValueKind.Undefined
                        ? sender.TryGetProperty("displayName", out var dn) ? dn.GetString() : "Unknown"
                        : "Unknown";
                    var webUrl    = msg.TryGetProperty("webUrl", out var wu) ? wu.GetString() : "";
                    var messageId = msg.TryGetProperty("id", out var mid) ? mid.GetString() : null;

                    var plainText = StripHtml(bodyContent);
                    var context   = plainText.Length > 200 ? plainText[..200] : plainText;

                    var sourceMeta = messageId is not null
                        ? System.Text.Json.JsonSerializer.Serialize(
                            new { teamId, channelId, messageId, chatType = "channel" })
                        : null;

                    commitments.Add(new RawCommitment(
                        Title:            InferTitle(plainText),
                        OwnerUserId:      userId ?? "unknown",
                        OwnerDisplayName: name ?? "Unknown",
                        SourceType:       CommitmentSourceType.Chat,
                        SourceUrl:        webUrl ?? "",
                        ExtractedAt:      DateTimeOffset.UtcNow,
                        DueAt:            InferDueDate(plainText),
                        Confidence:       0.70,
                        WatcherUserIds:   [],
                        SourceContext:    context,
                        SourceMetadata:   sourceMeta,
                        ProjectContext:   teamName,
                        ArtifactName:     channelDisplayName is not null ? $"#{channelDisplayName}" : null));
                }
            }
        }

        _logger.LogInformation("Chat extractor: {Count} raw commitments from last {Days}d", commitments.Count, days);
        return commitments;
    }

    private static bool HasActionSignal(string text)
    {
        var lower = text.ToLowerInvariant();
        return ActionSignals.Any(signal => lower.Contains(signal));
    }

    private static string InferTitle(string text)
    {
        // Use the first sentence that contains an action signal; fall back to first sentence.
        var sentences = text.Split(['.', '!', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var raw = sentences.FirstOrDefault(s => HasActionSignal(s))
                  ?? sentences.FirstOrDefault()
                  ?? text.Trim();
        raw = raw.Trim();
        return raw.Length > 80 ? raw[..80] + "…" : raw;
    }

    private static DateTimeOffset? InferDueDate(string text)
    {
        var lower = text.ToLowerInvariant();
        var now   = DateTimeOffset.UtcNow;
        if (lower.Contains("by eod") || lower.Contains("by end of day") || lower.Contains("today"))
            return now.Date.AddHours(18);
        if (lower.Contains("tomorrow"))
            return now.AddDays(1).Date.AddHours(18);
        if (lower.Contains("by friday") || lower.Contains("end of week"))
        {
            var daysUntilFriday = ((int)DayOfWeek.Friday - (int)now.DayOfWeek + 7) % 7;
            return now.AddDays(daysUntilFriday).Date.AddHours(18);
        }
        if (lower.Contains("next week") || lower.Contains("by monday"))
            return now.AddDays(7 - (int)now.DayOfWeek + 1).Date.AddHours(9);

        // Match "by Nth Month" or "by Month Nth" e.g. "by 8th March", "by March 8"
        var datePattern = System.Text.RegularExpressions.Regex.Match(lower,
            @"by (?:(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)|" +
            @"(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?)");
        if (datePattern.Success)
        {
            var monthNames = new[] { "", "january","february","march","april","may","june",
                                         "july","august","september","october","november","december" };
            int day, month;
            if (!string.IsNullOrEmpty(datePattern.Groups[1].Value))
            {
                day   = int.Parse(datePattern.Groups[1].Value);
                month = Array.IndexOf(monthNames, datePattern.Groups[2].Value);
            }
            else
            {
                month = Array.IndexOf(monthNames, datePattern.Groups[3].Value);
                day   = int.Parse(datePattern.Groups[4].Value);
            }
            if (month > 0 && day > 0)
            {
                var year = now.Year;
                var candidate = new DateTimeOffset(year, month, day, 18, 0, 0, TimeSpan.Zero);
                if (candidate < now) candidate = candidate.AddYears(1);
                return candidate;
            }
        }

        return null;
    }

    private static string StripHtml(string html)
    {
        return System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", " ").Trim();
    }

    private async Task<List<JsonElement>> GetPagedAsync(
        string url,
        string bearerToken,
        CancellationToken ct)
    {
        var results = new List<JsonElement>();
        string? nextLink = url;

        while (nextLink is not null)
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, nextLink);
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            using var resp = await _http.SendAsync(req, ct);

            if (!resp.IsSuccessStatusCode)
            {
                var errBody = await resp.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Chat extractor: Graph API returned {Status} for {Url} — {Body}",
                    (int)resp.StatusCode, nextLink,
                    errBody.Length > 500 ? errBody[..500] : errBody);
                break;
            }

            var json = await resp.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);

            if (doc.RootElement.TryGetProperty("value", out var value))
                foreach (var item in value.EnumerateArray())
                    results.Add(item.Clone());

            nextLink = doc.RootElement.TryGetProperty("@odata.nextLink", out var nl)
                ? nl.GetString()
                : null;
        }

        return results;
    }
}
