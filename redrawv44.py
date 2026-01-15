import cv2
import numpy as np
import rasterio
import matplotlib.pyplot as plt
import os
from cv2 import ximgproc
from shapely.geometry import LineString

def process_tif_image(tif_path):
    if not os.path.exists(tif_path): return None, None, None, None
    src = rasterio.open(tif_path)
    img_bgr = src.read([1, 2, 3]).transpose((1, 2, 0))
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Noise khatt karan layi Blur zaroori hai
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    ghost_bg = cv2.addWeighted(img_bgr, 0.4, np.full(img_bgr.shape, 255, dtype=np.uint8), 0.6, 0)
    
    binary = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, -10)
    thinned = ximgproc.thinning(binary, thinningType=ximgproc.THINNING_GUOHALL)
    
    display_view = ghost_bg.copy()
    visible_lines = cv2.dilate(thinned, np.ones((2,2), np.uint8))
    display_view[visible_lines > 0] = [0, 255, 0] 
    return img_bgr, thinned, display_view, src

def smart_merge_lines(lines, dist_threshold=60, angle_threshold=10):
    if lines is None: return []
    final_lines = []
    used = np.zeros(len(lines), dtype=bool)

    # Sort lines by length so we start with the most 'stable' ones
    sorted_indices = sorted(range(len(lines)), key=lambda k: np.linalg.norm(lines[k][0][:2] - lines[k][0][2:]), reverse=True)

    for i in sorted_indices:
        if used[i]: continue
        l1 = lines[i][0]
        angle1 = np.rad2deg(np.arctan2(l1[3] - l1[1], l1[2] - l1[0])) % 180
        current_group_pts = [(l1[0], l1[1]), (l1[2], l1[3])]
        used[i] = True

        for j in sorted_indices:
            if used[j]: continue
            l2 = lines[j][0]
            angle2 = np.rad2deg(np.arctan2(l2[3] - l2[1], l2[2] - l2[0])) % 180
            
            diff = abs(angle1 - angle2)
            if diff > 90: diff = 180 - diff
            
            if diff < angle_threshold:
                # Check perpendicular distance (to see if they are on the same 'track')
                mid2 = np.array([(l2[0]+l2[2])/2, (l2[1]+l2[3])/2])
                # Simple distance check for now
                mid1 = np.array([(l1[0]+l1[2])/2, (l1[1]+l1[3])/2])
                if np.linalg.norm(mid1 - mid2) < dist_threshold:
                    current_group_pts.append((l2[0], l2[1]))
                    current_group_pts.append((l2[2], l2[3]))
                    used[j] = True
        
        pts = np.array(current_group_pts)
        dist_mat = np.linalg.norm(pts[:, None, :] - pts[None, :, :], axis=-1)
        idx1, idx2 = np.unravel_index(np.argmax(dist_mat), dist_mat.shape)
        final_lines.append([int(pts[idx1][0]), int(pts[idx1][1]), int(pts[idx2][0]), int(pts[idx2][1])])
            
    return final_lines

def create_lat_long_rectangle(p1_pix, p2_pix, src, width_meters=2.2):
    lon1, lat1 = src.xy(p1_pix[1], p1_pix[0])
    lon2, lat2 = src.xy(p2_pix[1], p2_pix[0])
    degree_width = (width_meters / 111320.0) 
    line = LineString([(lon1, lat1), (lon2, lat2)])
    polygon = line.buffer(degree_width / 2, cap_style=2)
    return list(polygon.exterior.coords)[:4]

# RUNTIME
FILE_PATH = r"I:\code\trackingApp\tracking\GpsGiff\parking_final.tif"
img, skel, view, src_meta = process_tif_image(FILE_PATH)

if img is not None:
    fig, ax = plt.subplots(figsize=(15, 10))
    ax.imshow(view)
    ax.set_title("Box Select & ENTER | Super-Merge Active (Goal: 15 Groups)", fontsize=12)

    clicked_pts, temp_plots, id_labels = [], [], []

    def onclick(event):
        if event.xdata and event.ydata:
            clicked_pts.append((int(event.xdata), int(event.ydata)))
            p, = ax.plot(event.xdata, event.ydata, 'rs', markersize=5)
            temp_plots.append(p)
            fig.canvas.draw_idle()

    def onkey(event):
        global clicked_pts, temp_plots, id_labels
        if event.key == 'enter':
            if len(clicked_pts) < 3: return
            mask = np.zeros(skel.shape, dtype=np.uint8)
            poly_pts = np.array(clicked_pts, dtype=np.int32).reshape((-1, 1, 2))
            cv2.fillPoly(mask, [poly_pts], 255)
            zone = cv2.bitwise_and(skel, mask)
            
            # --- PARAMETERS CHANGED TO BRIDGE BIG GAPS ---
            # maxLineGap=250 means it will connect pieces even if they are far apart
            raw_lines = cv2.HoughLinesP(zone, 1, np.pi/180, threshold=50, minLineLength=80, maxLineGap=250)
            
            # dist_threshold=60 means it will merge parallel segments more aggressively
            final_lines = smart_merge_lines(raw_lines, dist_threshold=60, angle_threshold=10)

            print(f"\n--- {len(final_lines)} CLEAN RECTANGLES DETECTED ---")
            for label in id_labels: label.remove()
            id_labels = []

            for i, line in enumerate(final_lines):
                x1, y1, x2, y2 = line
                rect = create_lat_long_rectangle((x1, y1), (x2, y2), src_meta)
                print(f"ID {i+1} | Corners: {rect}")
                ax.plot([x1, x2], [y1, y2], color='blue', linewidth=3)
                txt = ax.text(x1, y1, str(i+1), color='yellow', weight='bold', fontsize=12, 
                             bbox=dict(facecolor='black', alpha=0.6, pad=1))
                id_labels.append(txt)
            
            for p in temp_plots: p.remove()
            temp_plots, clicked_pts = [], []
            fig.canvas.draw_idle()

    fig.canvas.mpl_connect('button_press_event', onclick)
    fig.canvas.mpl_connect('key_press_event', onkey)
    plt.show()
    src_meta.close()