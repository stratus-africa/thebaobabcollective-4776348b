            <div>
              <Label className="mb-1.5 block">What is Included (one per line)</Label>
              <Textarea
                rows={4}
                value={(adventure.included ?? []).join("\n")}
                placeholder={"All bespoke tented camp accommodations\nPrivate charter flights between camps\nAll meals, safari activities and beverages"}
                onChange={(e) =>
                  updateAdventure({
                    included: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Not Included (one per line)</Label>
              <Textarea
                rows={4}
                value={(adventure.notIncluded ?? []).join("\n")}
                placeholder={"International long-haul flights\nComprehensive travel & evacuation insurance\nDiscretionary gratuities to guides & camp staff"}
                onChange={(e) =>
                  updateAdventure({
                    notIncluded: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/adventures" })}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-gold text-gold-foreground hover:bg-gold/90 px-6"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </span>
            ) : (
              "Save Adventure"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}