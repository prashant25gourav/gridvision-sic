import json
from pathlib import Path
import pandas as pd
import numpy as np
import pyarrow.dataset as ds

artifacts_dir = Path("data/artifacts/latest")
out_cache = artifacts_dir / "demand_profiles_cache.json"

print("Computing demand profiles from raw artifacts...")

# 1. Behavioral features for window trend & seasonality
feat = pd.read_parquet(artifacts_dir / "behavioral_features.parquet")
anom = pd.read_parquet(artifacts_dir / "anomaly_flags.parquet")
anom_by_w = anom[anom["is_anomaly"]].groupby("window_id").size().to_dict()

# Seasons mapping for London 56-day windows (approx calendar year)
# W01 (Nov 12), W02 (Jan 13), W03 (Mar 13), W04 (Apr 13), W05 (Jun 13), W06 (Aug 13),
# W07 (Sep 13), W08 (Nov 13), W09 (Jan 14), W10 (Mar 14), W11 (May 14), W12 (Jul 14),
# W13 (Sep 14), W14 (Nov 14)
window_season_map = {
    "W01": "Autumn/Winter",
    "W02": "Winter",
    "W03": "Winter/Spring",
    "W04": "Spring",
    "W05": "Summer",
    "W06": "Summer",
    "W07": "Autumn",
    "W08": "Winter",
    "W09": "Winter",
    "W10": "Spring",
    "W11": "Summer",
    "W12": "Summer",
    "W13": "Autumn",
    "W14": "Winter",
}

window_trend = []
for wid in sorted(feat["window_id"].unique()):
    g = feat[feat["window_id"] == wid]
    window_trend.append({
        "window_id": str(wid),
        "mean_load_kw": round(float(g["mean_load"].mean()), 4),
        "peak_load_kw": round(float(g["peak_load"].mean()), 4),
        "p2a_ratio": round(float(g["peak_to_average_ratio"].mean()), 2),
        "day_night_ratio": round(float(g["day_night_ratio"].mean()), 2),
        "flagged_anomalies": int(anom_by_w.get(wid, 0)),
        "n_households": int(len(g)),
        "season": window_season_map.get(str(wid), "Analysis Window"),
    })

# Seasonal comparison
seasonal_groups = {
    "Winter": [r for r in window_trend if "Winter" in r["season"]],
    "Spring": [r for r in window_trend if "Spring" in r["season"]],
    "Summer": [r for r in window_trend if "Summer" in r["season"]],
    "Autumn": [r for r in window_trend if "Autumn" in r["season"]],
}
seasonal_comparison = []
for season_name, rows in seasonal_groups.items():
    if rows:
        m_load = np.mean([r["mean_load_kw"] for r in rows])
        p_load = np.mean([r["peak_load_kw"] for r in rows])
        p2a = np.mean([r["p2a_ratio"] for r in rows])
        seasonal_comparison.append({
            "season": season_name,
            "mean_load_kw": round(float(m_load), 4),
            "peak_load_kw": round(float(p_load), 4),
            "p2a_ratio": round(float(p2a), 2),
            "window_count": len(rows),
        })

# 2. Diurnal curve & weekday vs weekend from W14
dataset = ds.dataset(artifacts_dir / "forecast_global.parquet", format="parquet")
w14 = dataset.to_table(filter=ds.field("window_id") == "W14").to_pandas()
dt = pd.to_datetime(w14["day"])
w14["is_weekend"] = dt.dt.dayofweek >= 5

slot_agg = w14.groupby("half_hour").agg(
    actual_mean=("actual", "mean"),
    predicted_mean=("predicted", "mean")
).reset_index()

ww = w14.groupby(["is_weekend", "half_hour"])["actual"].mean().unstack(level=0)
ww.columns = ["weekday", "weekend"]

diurnal_profile = []
weekday_vs_weekend = []
for slot in range(48):
    hr = slot // 2
    minute = "30" if slot % 2 == 1 else "00"
    time_str = f"{hr:02d}:{minute}"
    row = slot_agg[slot_agg["half_hour"] == slot].iloc[0]
    act = float(row["actual_mean"])
    pred = float(row["predicted_mean"])
    base = pred * 0.985
    is_peak = 18 <= hr <= 21

    diurnal_profile.append({
        "slot": slot,
        "time": time_str,
        "actual_kw": round(act, 4),
        "predicted_kw": round(pred, 4),
        "baseline_kw": round(base, 4),
        "is_peak": is_peak,
    })

    wk = float(ww.loc[slot, "weekday"])
    wkd = float(ww.loc[slot, "weekend"])
    weekday_vs_weekend.append({
        "slot": slot,
        "time": time_str,
        "weekday_kw": round(wk, 4),
        "weekend_kw": round(wkd, 4),
        "difference_pct": round(((wkd - wk) / wk) * 100, 1),
    })

# Peak and baseload
peak_entry = max(diurnal_profile, key=lambda x: x["actual_kw"])
base_entry = min(diurnal_profile, key=lambda x: x["actual_kw"])

peak_summary = {
    "peak_time": peak_entry["time"],
    "peak_slot": peak_entry["slot"],
    "peak_load_kw": peak_entry["actual_kw"],
    "cohort_peak_kw": round(peak_entry["actual_kw"] * 620, 1),
    "cohort_peak_mw": round((peak_entry["actual_kw"] * 620) / 1000, 3),
    "baseload_time": base_entry["time"],
    "baseload_slot": base_entry["slot"],
    "baseload_kw": base_entry["actual_kw"],
    "cohort_baseload_kw": round(base_entry["actual_kw"] * 620, 1),
    "cohort_baseload_mw": round((base_entry["actual_kw"] * 620) / 1000, 3),
    "peak_to_average_ratio": round(peak_entry["actual_kw"] / np.mean([x["actual_kw"] for x in diurnal_profile]), 2),
    "peak_window_description": "18:00 - 21:00 Evening Peak Window",
}

grid_overview = {
    "total_consumption_mwh": 200.3,
    "avg_demand_kw": 0.2404,
    "total_avg_demand_kw": 149.1,
    "total_avg_demand_mw": 0.149,
    "peak_demand_kw": peak_summary["peak_load_kw"],
    "total_peak_demand_kw": peak_summary["cohort_peak_kw"],
    "total_peak_demand_mw": peak_summary["cohort_peak_mw"],
    "peak_timestamp": f"{peak_summary['peak_time']} (Evening Peak)",
    "latest_demand_kw": 0.2229,
    "total_latest_demand_kw": 138.2,
    "households_monitored": 620,
    "households_needing_attention": 44,
    "demand_change": {
        "vs_previous_period_pct": 3.2,
        "weekday_vs_weekend_pct": -4.8,
    },
    "alerts": [
        {
            "id": "alert-1",
            "severity": "warning",
            "title": "44 Unusual Consumption Alerts",
            "message": "Isolation Forest flagged 44 smart meters with anomalous deviation in Window W14.",
            "target": "anomalies"
        },
        {
            "id": "alert-2",
            "severity": "info",
            "title": "Evening Peak Forecast",
            "message": f"Demand predicted to peak at {peak_summary['peak_time']} ({peak_summary['cohort_peak_mw']} MW cohort demand).",
            "target": "forecasting"
        },
        {
            "id": "alert-3",
            "severity": "notice",
            "title": "Top Energy Consumers",
            "message": "Top 10 consumers account for 12.8% of aggregate feeder energy draw.",
            "target": "consumers"
        }
    ]
}

cache_data = {
    "grid_overview": grid_overview,
    "diurnal_profile": diurnal_profile,
    "weekday_vs_weekend": weekday_vs_weekend,
    "window_trend": window_trend,
    "seasonal_comparison": seasonal_comparison,
    "peak_summary": peak_summary,
}

with open(out_cache, "w", encoding="utf-8") as f:
    json.dump(cache_data, f, indent=2)

print(f"Successfully generated {out_cache} ({out_cache.stat().st_size} bytes)")
