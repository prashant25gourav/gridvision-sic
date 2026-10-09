# Anomaly Response Procedure

This procedure outlines operational protocols when an anomaly flag is triggered by the GridVision Isolation Forest detection engine.

### Anomaly Severity Levels
1. **Low Severity (|z| < 2.5):**
   - Behavioral deviation within acceptable operational tolerance.
   - Recommended action: Continue automated logging without immediate operator intervention.

2. **Medium Severity (2.5 <= |z| < 4.0):**
   - Noticeable shift in behavioral features such as daytime load, peak-to-average ratio, or ramping rate.
   - Recommended action: Verify data stream integrity and cross-reference with neighborhood substation feeder alerts.

3. **High Severity (|z| >= 4.0):**
   - Critical behavioral perturbation indicating equipment fault, unauthorized tap, severe meter freeze, or abnormal surge.
   - Recommended action: Flag for field technician meter diagnostic inspection or targeted customer communication.

### Common Triggering Statistics
- **Extreme Spike (`peak_load`, `ramp_rate`):** Sudden surge caused by industrial load, EV rapid charger, or faulty HVAC.
- **Prolonged Drop (`mean_load`, `std_load`):** Near-zero consumption suggesting vacancy, solar export mismatch, or damaged metering hardware.
- **Day/Night Inversion (`day_night_ratio`):** Heavy nocturnal consumption shift, indicating off-peak battery charging or unusual shift-work routines.

### Operator Investigation: What Should an Operator Check After an Unusual Consumption Event?
When an unusual consumption event or anomaly flag occurs, an operator should check:
1. Anomaly severity level (|z| score) to prioritize response: low severity (|z| < 2.5) requires automated logging only, whereas medium and high severity (|z| >= 2.5) require active investigation.
2. Smart meter data communication integrity to rule out telemetry dropout, packet delay, or meter freeze.
3. Substation feeder telemetry to determine if neighboring meters on the same distribution line experienced correlated voltage or demand fluctuations.
4. Utility maintenance logs and scheduled demand-response events before dispatching field technicians for on-site meter diagnostics.

