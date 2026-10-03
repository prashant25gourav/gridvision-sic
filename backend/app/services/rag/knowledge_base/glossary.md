# GridVision Glossary

### Cluster Instability
Cluster instability is a dynamic metric measuring how frequently an individual household changes its behavioral consumption segment over time. Unlike static segmentation that assigns a single permanent label, GridVision evaluates households longitudinally across 14 fixed 56-day common-calendar windows.
- **Persistence Formula:**
  $$Persistence(h) = 1 - \frac{\text{cluster changes observed}}{\text{transitions observed}}$$
- **Instability Formula:**
  $$Instability(h, w) = 1 - Persistence(h)$$
Instability is evaluated only across analysis windows using that household's own usable history, starting from Calibration Window 1.

### Volatility (CV)
Volatility is defined as the coefficient of variation (CV) of raw half-hourly consumption:
$$\text{Volatility CV} = \frac{\sigma(load)}{\mu(load)}$$
While volatility measures variations in raw electricity volume, instability captures structural changes in daily load patterns (e.g. shifts in peak timing or day-night ratios).

### Tail-Event Extreme Failure
An extreme forecast failure occurs when the standardized forecast error of a household exceeds a prospectively fixed threshold:
- Standardized Error ($StdError$):
  $$StdError = \frac{\text{AE} - \text{Calibration Median AE}}{\text{MAD}_{effective}}$$
- Extreme-Failure Threshold: Fixed strictly at 2.5804 (the 95th percentile of pooled calibration standardized errors).
- When $StdError > 2.5804$, the window forecast is classified as an extreme failure.
