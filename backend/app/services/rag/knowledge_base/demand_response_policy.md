# Demand Response and Load Management Policy

GridVision provides automated intelligence to support distribution network operators (DNOs) in managing grid strain and critical peak events.

### Household Reliability Tiers
GridVision classifies smart-metered households into three operational reliability tiers based on longitudinal stability:
1. **Stable (Instability <= 0.25):**
   - High predictability in baseline demand.
   - Ideal candidates for firm day-ahead capacity reservation and scheduled demand flexibility.
2. **Moderate (0.25 < Instability <= 0.60):**
   - Moderate behavioral mobility. May switch between clusters under price incentives or seasonal weather shifts.
   - Qualified for voluntary dynamic time-of-use tariffs.
3. **Elevated Risk (Instability > 0.60):**
   - High segment switching and erratic behavioral trajectories.
   - Forecasts carry higher tail-failure risk. Do not rely on firm reduction commitments without buffer margins.

### Load Shedding and Peak Mitigation
- Priority 1: Automated notification to households with high evening peak profiles.
- Priority 2: Coordinate storage and EV charging to off-peak slots (23:00 to 06:00).
- Priority 3: Target demand-response incentives towards flexible daytime consumers.
