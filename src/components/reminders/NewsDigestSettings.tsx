"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarClock, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { DigestWindowConfig, NewsSource } from "@prisma/client";

type DigestEntryPreview = {
  id: string;
  title?: string | null;
  summary?: string | null;
  url?: string | null;
  sentAt: string | null;
};

type DigestLogPreview = {
  id: string;
  deliveredAt: string;
  itemCount: number;
  window: Pick<DigestWindowConfig, "id" | "slug" | "timeUtc">;
  entries: DigestEntryPreview[];
};

export function NewsDigestSettings() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [windows, setWindows] = useState<DigestWindowConfig[]>([]);
  const [digests, setDigests] = useState<DigestLogPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);

  const selectedWindow = useMemo(
    () => windows.find((window) => window.id === selectedWindowId) ?? windows[0],
    [windows, selectedWindowId],
  );

  useEffect(() => {
    void refreshAll();
  }, []);

  async function refreshAll() {
    setLoading(true);
    try {
      const [sourcesRes, windowsRes, digestsRes] = await Promise.all([
        fetch("/api/news/sources"),
        fetch("/api/news/windows"),
        fetch("/api/news/digests?limit=5"),
      ]);
      if (!sourcesRes.ok || !windowsRes.ok || !digestsRes.ok) {
        throw new Error("Не удалось загрузить данные");
      }
      const sourcesData = (await sourcesRes.json()) as NewsSource[];
      const windowsData = (await windowsRes.json()) as DigestWindowConfig[];
      const digestsData = (await digestsRes.json()) as DigestLogPreview[];

      setSources(sourcesData);
      setWindows(windowsData);
      setDigests(digestsData);
      if (!selectedWindowId && windowsData.length > 0) {
        setSelectedWindowId(windowsData[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Не удалось загрузить настройки дайджеста");
    } finally {
      setLoading(false);
    }
  }

  async function toggleSource(id: string, enabled: boolean) {
    try {
      setSavingId(id);
      const response = await fetch("/api/news/sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      });
      if (!response.ok) {
        throw new Error("Не удалось обновить источник");
      }
      const updated = (await response.json()) as NewsSource;
      setSources((prev) => prev.map((source) => (source.id === id ? updated : source)));
      toast.success("Источник обновлён");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось обновить источник");
    } finally {
      setSavingId(null);
    }
  }

  async function updateWindow(id: string, payload: Partial<DigestWindowConfig>) {
    try {
      setSavingId(id);
      const response = await fetch("/api/news/windows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!response.ok) {
        throw new Error("Не удалось обновить окно");
      }
      const updated = (await response.json()) as DigestWindowConfig;
      setWindows((prev) => prev.map((window) => (window.id === id ? updated : window)));
      toast.success("Окно обновлено");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось обновить окно");
    } finally {
      setSavingId(null);
    }
  }

  function renderSource(source: NewsSource) {
    return (
      <motion.div
        key={source.id}
        layout
        className="rounded-2xl border border-qf-border-primary bg-qf-bg-secondary/60 p-4 flex items-center justify-between gap-4"
      >
        <div>
          <p className="font-semibold text-text-primary">{source.name}</p>
          <p className="text-xs text-text-tertiary">{source.type} · {source.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={source.enabled}
            onCheckedChange={(checked: boolean) => toggleSource(source.id, checked)}
            aria-label={`Источник ${source.name}`}
            data-testid={`news-source-${source.id}`}
          />
          <span className="text-xs text-text-secondary">{source.enabled ? "Вкл" : "Выкл"}</span>
        </div>
      </motion.div>
    );
  }

  function renderWindow(window: DigestWindowConfig) {
    const isActive = selectedWindow?.id === window.id;
    return (
      <motion.div
        key={window.id}
        layout
        className={`rounded-2xl border p-4 space-y-3 ${isActive ? "border-accent/60" : "border-qf-border-primary"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{window.slug}</p>
            <p className="text-xs text-text-secondary">{window.timeUtc} UTC</p>
          </div>
          <Switch
            checked={window.enabled}
            onCheckedChange={(checked: boolean) => updateWindow(window.id, { enabled: checked })}
            aria-label={`Окно ${window.slug}`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`time-${window.id}`}>Время (UTC)</Label>
            <Input
              id={`time-${window.id}`}
              value={window.timeUtc}
              onChange={(event) =>
                setWindows((prev) => prev.map((item) => (item.id === window.id ? { ...item, timeUtc: event.target.value } : item)))
              }
              onBlur={(event) => {
                const value = event.target.value.trim();
                if (value) void updateWindow(window.id, { timeUtc: value });
              }}
            />
          </div>
          <div>
            <Label htmlFor={`max-${window.id}`}>Максимум историй</Label>
            <Input
              id={`max-${window.id}`}
              type="number"
              min={1}
              max={50}
              value={window.maxItems ?? 5}
              onChange={(event) =>
                setWindows((prev) =>
                  prev.map((item) => (item.id === window.id ? { ...item, maxItems: Number(event.target.value) } : item)),
                )
              }
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value)) void updateWindow(window.id, { maxItems: value });
              }}
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setSelectedWindowId(window.id)}
        >
          Смотреть превью
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Источники и дайджесты</h2>
          <p className="text-sm text-text-secondary">Выберите источники, окна и просмотр последних отправок</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refreshAll()} disabled={loading}>
          <RefreshCcw className="w-4 h-4" /> Обновить
        </Button>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Источники новостей</h3>
          <p className="text-sm text-text-secondary">Включите только релевантные RSS/API</p>
        </div>
        {sources.length === 0 ? (
          <div className="py-6 text-sm text-text-secondary">Источники не найдены</div>
        ) : (
          <div className="space-y-3">
            {sources.map(renderSource)}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Окна дайджеста</h3>
            <p className="text-sm text-text-secondary">Настройте время отправки и лимиты</p>
          </div>
          <div className="w-48">
            <Select value={selectedWindow?.id} onValueChange={setSelectedWindowId}>
              <SelectTrigger>
                <SelectValue placeholder="Окно" />
              </SelectTrigger>
              <SelectContent>
                {windows.map((window) => (
                  <SelectItem key={window.id} value={window.id}>
                    {window.slug} · {window.timeUtc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {windows.length === 0 ? (
          <div className="py-6 text-sm text-text-secondary">Нет конфигов окон</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {windows.map(renderWindow)}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-text-secondary" />
          <h3 className="text-lg font-semibold">Последние отправки</h3>
        </div>
        {digests.length === 0 ? (
          <div className="py-6 text-sm text-text-secondary">Пока нет логов отправки</div>
        ) : (
          <div className="space-y-3">
            {digests.map((log) => (
              <div key={log.id} className="rounded-2xl border border-qf-border-primary p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {log.window.slug} · {log.window.timeUtc}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(log.deliveredAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  <span className="text-xs text-text-tertiary">{log.itemCount} материалов</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  {log.entries.map((entry) => (
                    <li key={entry.id} className="line-clamp-2">
                      • <span className="text-text-primary">{entry.title || "Без названия"}</span>
                      {entry.summary && <span className="text-text-terтиary"> — {entry.summary}</span>}
                    </li>
                  ))}
                  {log.entries.length === 0 && (
                    <li className="text-text-tertiary text-xs">Нет записей</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {savingId && <p className="text-xs text-text-tertiary">Сохраняем изменения…</p>}
    </div>
  );
}
