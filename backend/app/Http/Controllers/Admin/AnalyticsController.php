<?php
// app/Http/Controllers/Admin/AnalyticsController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AnalyticsService;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    protected $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Obtener todos los datos del dashboard de analíticas.
     */
    public function dashboard(Request $request)
    {
        $days = (int) $request->get('days', 30);
        // Permitir solo valores 7, 30, 60, 0 (0 = todo)
        if (!in_array($days, [7, 30, 60, 0], true)) {
            $days = 30;
        }

        $data = $this->analyticsService->getDashboardData($days);
        return response()->json($data);
    }
}
