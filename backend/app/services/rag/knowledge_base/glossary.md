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
- Extreme-Failure Threshold: Fixed strictly at 2.53438 (the 95th percentile of pooled calibration standardized errors).
- When $StdError > 2.53438$, the window forecast is classified as an extreme failure.

### Hungarian Alignment
Hungarian alignment is an optimal matching algorithm that prevents cluster label scrambling across time. Because K-Means clustering assigns cluster labels arbitrarily in each observation window, running clustering independently in each period would cause Cluster 0 in one window to represent a completely different behavior in the next. GridVision uses the Hungarian algorithm to chain each window's cluster centroids to the preceding window, minimizing centroid distance and preserving consistent behavioral identities over all 14 windows.

### Optimal Cluster Count (K=4): What Does K=4 Mean?
What does K=4 mean? GridVision selected K = 4 behavioral clusters through a silhouette coefficient sweep evaluated strictly on 1,240 calibration feature vectors. K = 4 achieved the highest partition separability (silhouette score 0.4021) among tested values K in [3, 8], identifying four distinct archetypes: Evening Peakers, Baseload Steady, Daytime Peakers, and Dual Peakers.

### Day-Ahead Demand Forecasting: How Does GridVision Forecast Electricity Demand?
How does GridVision forecast electricity demand? GridVision forecasts household electricity demand 24 hours ahead across 48 half-hourly time intervals using a pooled Gradient Boosted Decision Tree (GBDT) model. The forecaster utilizes lag features and time indicators without future data leakage, achieving a cohort mean absolute error of 0.081 kW and outperforming standard seasonal baselines by 31.4%.

### Forecast Reliability: What Does Forecast Reliability Mean?
What does forecast reliability mean? Forecast reliability reflects the expected dependability of a household's demand prediction. GridVision categorizes households into operational reliability tiers (Stable with instability <= 0.25, Moderate with 0.25 to 0.60, and Elevated Risk with instability > 0.60) based on longitudinal cluster stability and baseline consumption volatility. Stable households exhibit predictable usage routines, making their day-ahead forecasts highly dependable for capacity planning. In contrast, households with high demand volatility or frequent behavioral shifts carry higher forecast uncertainty and require wider operating safety margins.



