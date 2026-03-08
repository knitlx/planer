export interface NewsClassifierOptions {
  prisma: {
    newsRaw: {
      update: (args: unknown) => Promise<unknown>;
    };
    newsDigestEntry: {
      createMany: (args: unknown) => Promise<unknown>;
    };
  };
  fetchFn: (url: string, init: RequestInit) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;
  apiUrl: string;
  apiKey: string;
  model: string;
  interests: string[];
  selectWindowId: (item: { publishedAt?: string | Date | null }) => string | undefined;
}

export interface NewsRawLike {
  id: string;
  title: string;
  summary?: string | null;
  url: string;
  publishedAt?: Date | null;
}

interface ClassificationResult {
  id: string;
  interest: boolean;
  score?: number | null;
}

export class NewsClassifier {
  constructor(public readonly options: NewsClassifierOptions) {}

  async classifyBatch(items: NewsRawLike[]): Promise<void> {
    if (!items.length) {
      return;
    }

    const response = await this.callClassifierApi(items);
    if (!response?.length) {
      return;
    }

    const resultById = new Map<string, ClassificationResult>();
    for (const entry of response) {
      if (entry?.id) {
        resultById.set(entry.id, entry);
      }
    }

    const digestEntries: { rawId: string; windowId: string }[] = [];
    const now = new Date();

    for (const item of items) {
      const result = resultById.get(item.id);
      if (!result) {
        continue;
      }

      await this.options.prisma.newsRaw.update({
        where: { id: item.id },
        data: {
          llmInterest: result.interest,
          llmScore: typeof result.score === "number" ? Math.round(result.score) : null,
          classifiedAt: now,
        },
      } as Record<string, unknown>);

      if (result.interest) {
        const windowId = this.options.selectWindowId(item);
        if (windowId) {
          digestEntries.push({ rawId: item.id, windowId });
        }
      }
    }

    if (digestEntries.length > 0) {
      await this.options.prisma.newsDigestEntry.createMany({
        data: digestEntries,
        skipDuplicates: true,
      } as Record<string, unknown>);
    }
  }

  private async callClassifierApi(items: NewsRawLike[]): Promise<ClassificationResult[] | undefined> {
    try {
      const payload = {
        model: this.options.model,
        interests: this.options.interests,
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          url: item.url,
          publishedAt: item.publishedAt?.toISOString?.() ?? item.publishedAt ?? null,
        })),
      };

      const response = await this.options.fetchFn(this.options.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Classifier API responded with non-OK status");
        return undefined;
      }

      const body = (await response.json()) as { results?: ClassificationResult[] };
      return Array.isArray(body.results) ? body.results : undefined;
    } catch (error) {
      console.error("Failed to call classifier API:", error);
      return undefined;
    }
  }
}
